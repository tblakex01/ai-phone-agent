
export enum CallStatus {
  IDLE,
  GREETING,
  CONNECTING,
  LISTENING,
  AGENT_SPEAKING,
  THINKING,
  ERROR,
  ENDED
}

export interface TranscriptionEntry {
  speaker: 'user' | 'agent';
  text: string;
}

export type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export interface PersonaConfig {
  name: string;
  description?: string;
  systemInstruction: string;
  greeting: string;
  voice: VoiceName;
}
