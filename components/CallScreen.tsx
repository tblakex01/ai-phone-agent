
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CallStatus, TranscriptionEntry } from '../types';
import { connectToLiveSession, generateGreetingAudio } from '../services/geminiService';
import { decode, encode, decodeAudioData } from '../utils/audioUtils';
import { PhoneHangupIcon, MicIcon } from './Icons';
import StatusIndicator from './StatusIndicator';
import { LiveServerMessage, Blob } from '@google/genai';

interface CallScreenProps {
  onEndCall: () => void;
}

const CallScreen: React.FC<CallScreenProps> = ({ onEndCall }) => {
  const [status, setStatus] = useState<CallStatus>(CallStatus.IDLE);
  const [transcription, setTranscription] = useState<TranscriptionEntry[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  
  const audioQueueRef = useRef<{ base64: string; isGreeting: boolean }[]>([]);
  const isPlayingAudioRef = useRef(false);
  const nextStartTimeRef = useRef(0);
  
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);


  const processAudioQueue = useCallback(async () => {
    if (isPlayingAudioRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isPlayingAudioRef.current = true;
    const { base64, isGreeting } = audioQueueRef.current.shift()!;
    
    if (!outputAudioContextRef.current) {
        // FIX: Add type assertion to handle vendor-prefixed webkitAudioContext for older browsers.
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const audioContext = outputAudioContextRef.current;

    try {
        const audioBuffer = await decodeAudioData(decode(base64), audioContext, 24000, 1);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContext.currentTime);
        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += audioBuffer.duration;
        
        source.onended = () => {
            isPlayingAudioRef.current = false;
            if (isGreeting) {
                connectToLiveApi();
            }
            processAudioQueue();
        };

    } catch (error) {
        console.error("Error playing audio:", error);
        setStatus(CallStatus.ERROR);
        isPlayingAudioRef.current = false;
        processAudioQueue(); // Try next in queue
    }
  }, []);

  const handleMessage = useCallback((message: LiveServerMessage) => {
      const isAgentSpeaking = !!message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
      if (isAgentSpeaking) {
          setStatus(CallStatus.AGENT_SPEAKING);
      }

      const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
      if (base64Audio) {
          audioQueueRef.current.push({ base64: base64Audio, isGreeting: false });
          processAudioQueue();
      }

      if (message.serverContent?.outputTranscription) {
          currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
      }
      if (message.serverContent?.inputTranscription) {
          currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
      }

      if (message.serverContent?.turnComplete) {
          setTranscription(prev => [
              ...prev,
              { speaker: 'user', text: currentInputTranscriptionRef.current },
              { speaker: 'agent', text: currentOutputTranscriptionRef.current }
          ].filter(entry => entry.text.trim() !== ''));
          currentInputTranscriptionRef.current = '';
          currentOutputTranscriptionRef.current = '';
          if (!isPlayingAudioRef.current) {
              setStatus(CallStatus.LISTENING);
          }
      }
  }, [processAudioQueue]);

  const startMicrophone = useCallback(async () => {
    try {
      if(!inputAudioContextRef.current) {
          // FIX: Add type assertion to handle vendor-prefixed webkitAudioContext for older browsers.
          inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      const context = inputAudioContextRef.current;

      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      sourceNodeRef.current = context.createMediaStreamSource(streamRef.current);
      scriptProcessorRef.current = context.createScriptProcessor(4096, 1, 1);
      
      scriptProcessorRef.current.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        const pcmBlob: Blob = {
          data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
          mimeType: 'audio/pcm;rate=16000',
        };
        sessionPromiseRef.current?.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
        });
      };
      
      sourceNodeRef.current.connect(scriptProcessorRef.current);
      scriptProcessorRef.current.connect(context.destination);
      setStatus(CallStatus.LISTENING);

    } catch (err) {
      console.error("Microphone access denied:", err);
      setPermissionError("Microphone access is required. Please enable it in your browser settings and restart the call.");
      setStatus(CallStatus.ERROR);
    }
  }, []);

  const connectToLiveApi = useCallback(() => {
    setStatus(CallStatus.CONNECTING);
    sessionPromiseRef.current = connectToLiveSession({
        onOpen: startMicrophone,
        onMessage: handleMessage,
        onError: (e) => {
            console.error("Session error:", e);
            setStatus(CallStatus.ERROR);
        },
        onClose: () => {
            setStatus(CallStatus.ENDED);
        },
    });
  }, [startMicrophone, handleMessage]);

  useEffect(() => {
    const startSequence = async () => {
        setStatus(CallStatus.GREETING);
        try {
            const greetingAudio = await generateGreetingAudio();
            audioQueueRef.current.push({ base64: greetingAudio, isGreeting: true });
            processAudioQueue();
        } catch (error) {
            console.error("Failed to start call sequence:", error);
            setStatus(CallStatus.ERROR);
        }
    };
    startSequence();

    return () => {
        sessionPromiseRef.current?.then(session => session.close());
        streamRef.current?.getTracks().forEach(track => track.stop());
        sourceNodeRef.current?.disconnect();
        scriptProcessorRef.current?.disconnect();
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleEndCall = () => {
    onEndCall();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="p-6 text-center border-b border-gray-700">
        <h2 className="text-xl font-semibold">AI Phone Agent</h2>
        <StatusIndicator status={status} />
      </div>

      <div className="flex-grow p-6 overflow-y-auto space-y-4">
        {transcription.map((entry, index) => (
          <div key={index} className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-sm lg:max-w-md p-3 rounded-2xl ${entry.speaker === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
              <p className="text-white">{entry.text}</p>
            </div>
          </div>
        ))}
         {permissionError && (
          <div className="flex justify-center">
            <div className="bg-red-800/50 p-4 rounded-lg text-red-300 text-center">
              {permissionError}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 flex justify-center items-center border-t border-gray-700">
        <button
          onClick={handleEndCall}
          className="group flex items-center justify-center w-20 h-20 bg-red-600 rounded-full hover:bg-red-700 transition-all duration-300 shadow-lg transform hover:scale-105"
        >
          <PhoneHangupIcon className="w-10 h-10 text-white" />
        </button>
      </div>
    </div>
  );
};

export default CallScreen;