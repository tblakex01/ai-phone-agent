
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CallStatus, TranscriptionEntry, PersonaConfig } from '../types';
import { MAX_TRANSCRIPTION_HISTORY } from '../constants';
import { connectToLiveSession, generateGreetingAudio } from '../services/geminiService';
import { decode, encode, decodeAudioData, floatToPcmInt16 } from '../utils/audioUtils';
import { logger } from '../utils/logger';
import { PhoneHangupIcon } from './Icons';
import StatusIndicator from './StatusIndicator';
import { LiveServerMessage, Blob as GenAIBlob } from '@google/genai';

interface CallScreenProps {
  onEndCall: () => void;
  config: PersonaConfig;
}

const CallScreen: React.FC<CallScreenProps> = ({ onEndCall, config }) => {
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
        try {
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        } catch (e) {
            logger.error("Failed to create AudioContext", e);
            setStatus(CallStatus.ERROR);
            return;
        }
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
        logger.error("Error playing audio:", error);
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
          const userText = currentInputTranscriptionRef.current;
          const agentText = currentOutputTranscriptionRef.current;

          setTranscription(prev => {
              const newEntries = [
                  ...prev,
                  { speaker: 'user' as const, text: userText },
                  { speaker: 'agent' as const, text: agentText }
              ].filter(entry => entry.text.trim() !== '');
              return newEntries.slice(-MAX_TRANSCRIPTION_HISTORY);
          });
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
          inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      const context = inputAudioContextRef.current;

      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      sourceNodeRef.current = context.createMediaStreamSource(streamRef.current);
      scriptProcessorRef.current = context.createScriptProcessor(4096, 1, 1);
      
      scriptProcessorRef.current.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        // Allocate Int16Array directly and fill with a for-loop to avoid
        // intermediate JS array allocation from .map() in real-time audio path
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = floatToPcmInt16(inputData[i]);
        }
        // Using GenAIBlob type alias for clarity and to avoid conflict with DOM Blob
        const pcmBlob: GenAIBlob = {
          data: encode(new Uint8Array(pcmData.buffer)),
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
      logger.error("Microphone access denied:", err);
      setPermissionError("Microphone access is required. Please enable it in your browser settings and restart the call.");
      setStatus(CallStatus.ERROR);
    }
  }, []);

  const connectToLiveApi = useCallback(() => {
    setStatus(CallStatus.CONNECTING);
    sessionPromiseRef.current = connectToLiveSession(
        {
            onOpen: startMicrophone,
            onMessage: handleMessage,
            onError: (e) => {
                logger.error("Session error:", e);
                setStatus(CallStatus.ERROR);
            },
            onClose: () => {
                setStatus(CallStatus.ENDED);
            },
        },
        config.systemInstruction,
        config.voice
    );
  }, [startMicrophone, handleMessage, config.systemInstruction, config.voice]);

  useEffect(() => {
    const startSequence = async () => {
        setStatus(CallStatus.GREETING);
        try {
            const greetingAudio = await generateGreetingAudio(config.greeting, config.voice);
            audioQueueRef.current.push({ base64: greetingAudio, isGreeting: true });
            processAudioQueue();
        } catch (error) {
            logger.error("Failed to start call sequence:", error);
            // Fallback: If TTS fails, just try connecting
            connectToLiveApi();
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
      <div className="p-6 text-center border-b border-gray-700 bg-gray-800">
        <h2 className="text-xl font-bold text-white mb-1">{config.name}</h2>
        <p className="text-xs text-gray-400 mb-3">{config.description || 'Active Call'}</p>
        <StatusIndicator status={status} />
      </div>

      <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-gray-900 scrollbar-thin scrollbar-thumb-gray-700">
        {transcription.map((entry, index) => (
          <div key={index} className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${entry.speaker === 'user' ? 'bg-blue-600 rounded-br-none text-white' : 'bg-gray-700 rounded-bl-none text-gray-100'}`}>
              <p className="text-sm md:text-base">{entry.text}</p>
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

      <div className="p-6 flex justify-center items-center border-t border-gray-700 bg-gray-800">
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
