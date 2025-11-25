
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
