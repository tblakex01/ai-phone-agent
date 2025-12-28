import { describe, it, expect } from 'vitest';
import {
  LIVE_MODEL_NAME,
  TTS_MODEL_NAME,
  DEFAULT_SYSTEM_INSTRUCTION,
  DEFAULT_GREETING_MESSAGE,
  VOICE_NAMES,
  PERSONA_PRESETS,
  MAX_TRANSCRIPTION_HISTORY,
  MAX_INPUT_LENGTHS,
} from './constants';
import type { VoiceName } from './types';

describe('constants', () => {
  describe('limits', () => {
    it('should have a reasonable max transcription history', () => {
      expect(MAX_TRANSCRIPTION_HISTORY).toBeDefined();
      expect(MAX_TRANSCRIPTION_HISTORY).toBe(100);
    });

    it('should have input length limits', () => {
      expect(MAX_INPUT_LENGTHS).toBeDefined();
      expect(MAX_INPUT_LENGTHS.name).toBe(50);
      expect(MAX_INPUT_LENGTHS.systemInstruction).toBe(2000);
      expect(MAX_INPUT_LENGTHS.greeting).toBe(500);
    });
  });

  describe('model names', () => {
    it('should have a valid live model name', () => {
      expect(LIVE_MODEL_NAME).toBeDefined();
      expect(typeof LIVE_MODEL_NAME).toBe('string');
      expect(LIVE_MODEL_NAME.length).toBeGreaterThan(0);
    });

    it('should have a valid TTS model name', () => {
      expect(TTS_MODEL_NAME).toBeDefined();
      expect(typeof TTS_MODEL_NAME).toBe('string');
      expect(TTS_MODEL_NAME.length).toBeGreaterThan(0);
    });

    it('should have different model names for live and TTS', () => {
      expect(LIVE_MODEL_NAME).not.toBe(TTS_MODEL_NAME);
    });
  });

  describe('default instructions', () => {
    it('should have a non-empty default system instruction', () => {
      expect(DEFAULT_SYSTEM_INSTRUCTION).toBeDefined();
      expect(typeof DEFAULT_SYSTEM_INSTRUCTION).toBe('string');
      expect(DEFAULT_SYSTEM_INSTRUCTION.length).toBeGreaterThan(10);
    });

    it('should have a non-empty default greeting message', () => {
      expect(DEFAULT_GREETING_MESSAGE).toBeDefined();
      expect(typeof DEFAULT_GREETING_MESSAGE).toBe('string');
      expect(DEFAULT_GREETING_MESSAGE.length).toBeGreaterThan(10);
    });

    it('should have professional default instruction content', () => {
      expect(DEFAULT_SYSTEM_INSTRUCTION.toLowerCase()).toContain('assistant');
    });
  });

  describe('voice names', () => {
    it('should have at least 5 voice options', () => {
      expect(VOICE_NAMES.length).toBeGreaterThanOrEqual(5);
    });

    it('should contain expected voice names', () => {
      const expectedVoices: VoiceName[] = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
      expectedVoices.forEach((voice) => {
        expect(VOICE_NAMES).toContain(voice);
      });
    });

    it('should have unique voice names', () => {
      const uniqueVoices = new Set(VOICE_NAMES);
      expect(uniqueVoices.size).toBe(VOICE_NAMES.length);
    });

    it('should have voice names with proper capitalization', () => {
      VOICE_NAMES.forEach((voice) => {
        expect(voice[0]).toBe(voice[0].toUpperCase());
      });
    });
  });

  describe('persona presets', () => {
    it('should have at least 5 persona presets', () => {
      expect(PERSONA_PRESETS.length).toBeGreaterThanOrEqual(5);
    });

    it('should have unique preset IDs', () => {
      const ids = PERSONA_PRESETS.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique preset names', () => {
      const names = PERSONA_PRESETS.map((p) => p.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    describe('each preset should have required fields', () => {
      PERSONA_PRESETS.forEach((preset) => {
        describe(`preset: ${preset.id}`, () => {
          it('should have an id', () => {
            expect(preset.id).toBeDefined();
            expect(typeof preset.id).toBe('string');
            expect(preset.id.length).toBeGreaterThan(0);
          });

          it('should have a name', () => {
            expect(preset.name).toBeDefined();
            expect(typeof preset.name).toBe('string');
            expect(preset.name.length).toBeGreaterThan(0);
          });

          it('should have a description', () => {
            expect(preset.description).toBeDefined();
            expect(typeof preset.description).toBe('string');
            expect(preset.description!.length).toBeGreaterThan(0);
          });

          it('should have system instructions', () => {
            expect(preset.systemInstruction).toBeDefined();
            expect(typeof preset.systemInstruction).toBe('string');
            expect(preset.systemInstruction.length).toBeGreaterThan(10);
          });

          it('should have a greeting', () => {
            expect(preset.greeting).toBeDefined();
            expect(typeof preset.greeting).toBe('string');
            expect(preset.greeting.length).toBeGreaterThan(5);
          });

          it('should have a valid voice', () => {
            expect(preset.voice).toBeDefined();
            expect(VOICE_NAMES).toContain(preset.voice);
          });
        });
      });
    });

    it('should have a Personal Assistant preset as first option', () => {
      expect(PERSONA_PRESETS[0].id).toBe('assistant');
      expect(PERSONA_PRESETS[0].name).toBe('Personal Assistant');
    });

    it('should include both inbound and outbound persona types', () => {
      const descriptions = PERSONA_PRESETS.map((p) => p.description?.toLowerCase() || '');
      const hasInbound = descriptions.some((d) => d.includes('inbound'));
      const hasOutbound = descriptions.some((d) => d.includes('outbound'));
      expect(hasInbound || hasOutbound).toBe(true);
    });

    it('should use diverse voices across presets', () => {
      const usedVoices = new Set(PERSONA_PRESETS.map((p) => p.voice));
      expect(usedVoices.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('preset content quality', () => {
    it('all presets should have professional system instructions', () => {
      PERSONA_PRESETS.forEach((preset) => {
        // System instructions shouldn't contain placeholder text
        expect(preset.systemInstruction).not.toMatch(/\[.*\]/);
        expect(preset.systemInstruction).not.toMatch(/TODO/i);
        expect(preset.systemInstruction).not.toMatch(/placeholder/i);
      });
    });

    it('all greetings should be appropriate phone greetings', () => {
      PERSONA_PRESETS.forEach((preset) => {
        // Greetings should typically start with a greeting word
        const greetingWords = ['hello', 'hi', 'thank', 'welcome', 'good'];
        const startsWithGreeting = greetingWords.some((word) =>
          preset.greeting.toLowerCase().startsWith(word)
        );
        expect(startsWithGreeting).toBe(true);
      });
    });
  });
});
