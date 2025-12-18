
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { LIVE_MODEL_NAME, TTS_MODEL_NAME } from '../constants';

// Use import.meta.env instead of process.env for better security and standard Vite usage
const apiKey = import.meta.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });

export const generateGreetingAudio = async (text: string, voiceName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: TTS_MODEL_NAME,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
    throw new Error("No audio data received from TTS API.");
  } catch (error) {
    console.error("Error generating greeting audio:", error);
    throw error;
  }
};

interface LiveSessionCallbacks {
  onOpen: () => void;
  onMessage: (message: LiveServerMessage) => void;
  onError: (error: ErrorEvent) => void;
  onClose: (event: CloseEvent) => void;
}

export const connectToLiveSession = (
  callbacks: LiveSessionCallbacks,
  systemInstruction: string,
  voiceName: string
) => {
  return ai.live.connect({
    model: LIVE_MODEL_NAME,
    callbacks: {
      onopen: callbacks.onOpen,
      onmessage: callbacks.onMessage,
      onerror: callbacks.onError,
      onclose: callbacks.onClose,
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName } },
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: systemInstruction,
    },
  });
};
