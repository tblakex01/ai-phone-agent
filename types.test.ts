import { describe, it, expect } from 'vitest';
import { CallStatus, TranscriptionEntry, VoiceName, PersonaConfig } from './types';

describe('types', () => {
  describe('CallStatus enum', () => {
    it('should have IDLE status', () => {
      expect(CallStatus.IDLE).toBeDefined();
      expect(typeof CallStatus.IDLE).toBe('number');
    });

    it('should have GREETING status', () => {
      expect(CallStatus.GREETING).toBeDefined();
    });

    it('should have CONNECTING status', () => {
      expect(CallStatus.CONNECTING).toBeDefined();
    });

    it('should have LISTENING status', () => {
      expect(CallStatus.LISTENING).toBeDefined();
    });

    it('should have AGENT_SPEAKING status', () => {
      expect(CallStatus.AGENT_SPEAKING).toBeDefined();
    });

    it('should have THINKING status', () => {
      expect(CallStatus.THINKING).toBeDefined();
    });

    it('should have ERROR status', () => {
      expect(CallStatus.ERROR).toBeDefined();
    });

    it('should have ENDED status', () => {
      expect(CallStatus.ENDED).toBeDefined();
    });

    it('should have 8 unique status values', () => {
      const statuses = [
        CallStatus.IDLE,
        CallStatus.GREETING,
        CallStatus.CONNECTING,
        CallStatus.LISTENING,
        CallStatus.AGENT_SPEAKING,
        CallStatus.THINKING,
        CallStatus.ERROR,
        CallStatus.ENDED,
      ];

      const uniqueStatuses = new Set(statuses);
      expect(uniqueStatuses.size).toBe(8);
    });

    it('should have sequential numeric values starting from 0', () => {
      expect(CallStatus.IDLE).toBe(0);
      expect(CallStatus.GREETING).toBe(1);
      expect(CallStatus.CONNECTING).toBe(2);
      expect(CallStatus.LISTENING).toBe(3);
      expect(CallStatus.AGENT_SPEAKING).toBe(4);
      expect(CallStatus.THINKING).toBe(5);
      expect(CallStatus.ERROR).toBe(6);
      expect(CallStatus.ENDED).toBe(7);
    });

    it('should be usable in switch statements', () => {
      const getStatusName = (status: CallStatus): string => {
        switch (status) {
          case CallStatus.IDLE:
            return 'idle';
          case CallStatus.GREETING:
            return 'greeting';
          case CallStatus.CONNECTING:
            return 'connecting';
          case CallStatus.LISTENING:
            return 'listening';
          case CallStatus.AGENT_SPEAKING:
            return 'speaking';
          case CallStatus.THINKING:
            return 'thinking';
          case CallStatus.ERROR:
            return 'error';
          case CallStatus.ENDED:
            return 'ended';
          default:
            return 'unknown';
        }
      };

      expect(getStatusName(CallStatus.IDLE)).toBe('idle');
      expect(getStatusName(CallStatus.LISTENING)).toBe('listening');
      expect(getStatusName(CallStatus.ERROR)).toBe('error');
    });
  });

  describe('TranscriptionEntry interface', () => {
    it('should accept valid user transcription', () => {
      const entry: TranscriptionEntry = {
        speaker: 'user',
        text: 'Hello, how are you?',
      };

      expect(entry.speaker).toBe('user');
      expect(entry.text).toBe('Hello, how are you?');
    });

    it('should accept valid agent transcription', () => {
      const entry: TranscriptionEntry = {
        speaker: 'agent',
        text: 'I am doing well, thank you!',
      };

      expect(entry.speaker).toBe('agent');
      expect(entry.text).toBe('I am doing well, thank you!');
    });

    it('should handle empty text', () => {
      const entry: TranscriptionEntry = {
        speaker: 'user',
        text: '',
      };

      expect(entry.text).toBe('');
    });

    it('should handle long text', () => {
      const longText = 'A'.repeat(10000);
      const entry: TranscriptionEntry = {
        speaker: 'agent',
        text: longText,
      };

      expect(entry.text.length).toBe(10000);
    });

    it('should handle unicode text', () => {
      const entry: TranscriptionEntry = {
        speaker: 'user',
        text: '你好世界 🌍 مرحبا',
      };

      expect(entry.text).toBe('你好世界 🌍 مرحبا');
    });
  });

  describe('VoiceName type', () => {
    it('should accept Puck as valid voice', () => {
      const voice: VoiceName = 'Puck';
      expect(voice).toBe('Puck');
    });

    it('should accept Charon as valid voice', () => {
      const voice: VoiceName = 'Charon';
      expect(voice).toBe('Charon');
    });

    it('should accept Kore as valid voice', () => {
      const voice: VoiceName = 'Kore';
      expect(voice).toBe('Kore');
    });

    it('should accept Fenrir as valid voice', () => {
      const voice: VoiceName = 'Fenrir';
      expect(voice).toBe('Fenrir');
    });

    it('should accept Zephyr as valid voice', () => {
      const voice: VoiceName = 'Zephyr';
      expect(voice).toBe('Zephyr');
    });

    it('should work in arrays', () => {
      const voices: VoiceName[] = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
      expect(voices).toHaveLength(5);
    });
  });

  describe('PersonaConfig interface', () => {
    it('should accept minimal valid config', () => {
      const config: PersonaConfig = {
        name: 'Test Persona',
        systemInstruction: 'You are a test assistant',
        greeting: 'Hello!',
        voice: 'Kore',
      };

      expect(config.name).toBe('Test Persona');
      expect(config.systemInstruction).toBe('You are a test assistant');
      expect(config.greeting).toBe('Hello!');
      expect(config.voice).toBe('Kore');
    });

    it('should accept config with optional description', () => {
      const config: PersonaConfig = {
        name: 'Test Persona',
        description: 'A detailed description',
        systemInstruction: 'You are a test assistant',
        greeting: 'Hello!',
        voice: 'Puck',
      };

      expect(config.description).toBe('A detailed description');
    });

    it('should work without description', () => {
      const config: PersonaConfig = {
        name: 'Minimal Persona',
        systemInstruction: 'Be helpful',
        greeting: 'Hi',
        voice: 'Fenrir',
      };

      expect(config.description).toBeUndefined();
    });

    it('should accept all valid voice types', () => {
      const voices: VoiceName[] = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

      voices.forEach((voice) => {
        const config: PersonaConfig = {
          name: 'Test',
          systemInstruction: 'Test',
          greeting: 'Test',
          voice,
        };
        expect(config.voice).toBe(voice);
      });
    });

    it('should handle long system instructions', () => {
      const longInstruction = 'Be helpful. '.repeat(1000);
      const config: PersonaConfig = {
        name: 'Test',
        systemInstruction: longInstruction,
        greeting: 'Hi',
        voice: 'Zephyr',
      };

      expect(config.systemInstruction.length).toBeGreaterThan(10000);
    });

    it('should handle unicode in all string fields', () => {
      const config: PersonaConfig = {
        name: '助手 Assistant',
        description: '一个有帮助的助手 🤖',
        systemInstruction: '你是一个有帮助的助手',
        greeting: '你好！有什么可以帮助你的？',
        voice: 'Kore',
      };

      expect(config.name).toContain('助手');
      expect(config.description).toContain('🤖');
      expect(config.greeting).toContain('你好');
    });
  });

  describe('type guards and runtime validation patterns', () => {
    const isValidVoiceName = (voice: string): voice is VoiceName => {
      return ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].includes(voice);
    };

    const isValidTranscriptionEntry = (entry: unknown): entry is TranscriptionEntry => {
      if (typeof entry !== 'object' || entry === null) return false;
      const obj = entry as Record<string, unknown>;
      return (
        (obj.speaker === 'user' || obj.speaker === 'agent') &&
        typeof obj.text === 'string'
      );
    };

    const isValidPersonaConfig = (config: unknown): config is PersonaConfig => {
      if (typeof config !== 'object' || config === null) return false;
      const obj = config as Record<string, unknown>;
      return (
        typeof obj.name === 'string' &&
        typeof obj.systemInstruction === 'string' &&
        typeof obj.greeting === 'string' &&
        isValidVoiceName(obj.voice as string)
      );
    };

    it('should validate voice names correctly', () => {
      expect(isValidVoiceName('Puck')).toBe(true);
      expect(isValidVoiceName('Kore')).toBe(true);
      expect(isValidVoiceName('InvalidVoice')).toBe(false);
      expect(isValidVoiceName('')).toBe(false);
    });

    it('should validate transcription entries correctly', () => {
      expect(isValidTranscriptionEntry({ speaker: 'user', text: 'Hello' })).toBe(true);
      expect(isValidTranscriptionEntry({ speaker: 'agent', text: '' })).toBe(true);
      expect(isValidTranscriptionEntry({ speaker: 'other', text: 'Hi' })).toBe(false);
      expect(isValidTranscriptionEntry({ text: 'Hi' })).toBe(false);
      expect(isValidTranscriptionEntry(null)).toBe(false);
      expect(isValidTranscriptionEntry('string')).toBe(false);
    });

    it('should validate persona configs correctly', () => {
      expect(
        isValidPersonaConfig({
          name: 'Test',
          systemInstruction: 'Be helpful',
          greeting: 'Hello',
          voice: 'Kore',
        })
      ).toBe(true);

      expect(
        isValidPersonaConfig({
          name: 'Test',
          description: 'Optional',
          systemInstruction: 'Be helpful',
          greeting: 'Hello',
          voice: 'Puck',
        })
      ).toBe(true);

      expect(
        isValidPersonaConfig({
          name: 'Test',
          systemInstruction: 'Be helpful',
          greeting: 'Hello',
          voice: 'InvalidVoice',
        })
      ).toBe(false);

      expect(isValidPersonaConfig(null)).toBe(false);
      expect(isValidPersonaConfig({})).toBe(false);
    });
  });
});
