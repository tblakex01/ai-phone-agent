import { describe, it, expect, vi, beforeEach } from 'vitest';
import { decode, encode, decodeAudioData } from './audioUtils';

describe('audioUtils', () => {
  describe('encode', () => {
    it('should encode a simple byte array to base64', () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const result = encode(bytes);
      expect(result).toBe('SGVsbG8=');
    });

    it('should encode an empty byte array', () => {
      const bytes = new Uint8Array([]);
      const result = encode(bytes);
      expect(result).toBe('');
    });

    it('should encode binary data correctly', () => {
      const bytes = new Uint8Array([0, 128, 255]);
      const result = encode(bytes);
      expect(result).toBe('AID/');
    });

    it('should handle single byte input', () => {
      const bytes = new Uint8Array([65]); // 'A'
      const result = encode(bytes);
      expect(result).toBe('QQ==');
    });

    it('should handle large arrays', () => {
      const bytes = new Uint8Array(1000).fill(0);
      const result = encode(bytes);
      expect(result).toHaveLength(1336); // Base64 encoded length
    });
  });

  describe('decode', () => {
    it('should decode a base64 string to byte array', () => {
      const base64 = 'SGVsbG8='; // "Hello"
      const result = decode(base64);
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    it('should decode an empty string', () => {
      const result = decode('');
      expect(result).toEqual(new Uint8Array([]));
    });

    it('should decode binary data correctly', () => {
      const base64 = 'AID/';
      const result = decode(base64);
      expect(Array.from(result)).toEqual([0, 128, 255]);
    });

    it('should handle padding correctly', () => {
      const base64 = 'QQ=='; // 'A'
      const result = decode(base64);
      expect(Array.from(result)).toEqual([65]);
    });

    it('should handle base64 without padding', () => {
      const base64 = 'SGVsbG8'; // Some decoders accept this
      const result = decode(base64);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('encode/decode roundtrip', () => {
    it('should correctly roundtrip simple data', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5]);
      const encoded = encode(original);
      const decoded = decode(encoded);
      expect(Array.from(decoded)).toEqual(Array.from(original));
    });

    it('should correctly roundtrip audio-like data', () => {
      // Simulate PCM audio data (Int16 values)
      const int16Data = new Int16Array([0, 1000, -1000, 32767, -32768]);
      const bytes = new Uint8Array(int16Data.buffer);
      const encoded = encode(bytes);
      const decoded = decode(encoded);
      expect(Array.from(decoded)).toEqual(Array.from(bytes));
    });

    it('should correctly roundtrip random binary data', () => {
      const original = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        original[i] = i;
      }
      const encoded = encode(original);
      const decoded = decode(encoded);
      expect(Array.from(decoded)).toEqual(Array.from(original));
    });

    it('should correctly roundtrip large data', () => {
      const original = new Uint8Array(10000);
      for (let i = 0; i < original.length; i++) {
        original[i] = i % 256;
      }
      const encoded = encode(original);
      const decoded = decode(encoded);
      expect(Array.from(decoded)).toEqual(Array.from(original));
    });
  });

  describe('decodeAudioData', () => {
    let mockAudioContext: {
      createBuffer: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockAudioContext = {
        createBuffer: vi.fn((channels, frameCount, sampleRate) => {
          const channelData: Float32Array[] = [];
          for (let i = 0; i < channels; i++) {
            channelData.push(new Float32Array(frameCount));
          }
          return {
            numberOfChannels: channels,
            length: frameCount,
            sampleRate,
            duration: frameCount / sampleRate,
            getChannelData: vi.fn((channel: number) => channelData[channel]),
          };
        }),
      };
    });

    it('should decode mono audio data', async () => {
      // Create Int16 audio samples
      const int16Data = new Int16Array([0, 16384, 32767, -32768, -16384]);
      const data = new Uint8Array(int16Data.buffer);

      const buffer = await decodeAudioData(
        data,
        mockAudioContext as unknown as AudioContext,
        24000,
        1
      );

      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, 5, 24000);
      expect(buffer.getChannelData).toHaveBeenCalledWith(0);
    });

    it('should decode stereo audio data', async () => {
      // Stereo: L R L R L R (3 frames, 2 channels)
      const int16Data = new Int16Array([0, 1000, 2000, 3000, 4000, 5000]);
      const data = new Uint8Array(int16Data.buffer);

      await decodeAudioData(
        data,
        mockAudioContext as unknown as AudioContext,
        24000,
        2
      );

      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(2, 3, 24000);
    });

    it('should normalize Int16 values to Float32 range', async () => {
      // Max positive: 32767 -> ~1.0
      // Max negative: -32768 -> -1.0
      const int16Data = new Int16Array([32767, -32768, 0]);
      const data = new Uint8Array(int16Data.buffer);

      const capturedChannelData = new Float32Array(3);
      mockAudioContext.createBuffer = vi.fn(() => ({
        getChannelData: vi.fn(() => capturedChannelData),
      }));

      await decodeAudioData(
        data,
        mockAudioContext as unknown as AudioContext,
        24000,
        1
      );

      // Check normalization
      expect(capturedChannelData[0]).toBeCloseTo(32767 / 32768.0, 4);
      expect(capturedChannelData[1]).toBeCloseTo(-32768 / 32768.0, 4);
      expect(capturedChannelData[2]).toBe(0);
    });

    it('should handle empty audio data', async () => {
      const data = new Uint8Array(0);

      await decodeAudioData(
        data,
        mockAudioContext as unknown as AudioContext,
        24000,
        1
      );

      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, 0, 24000);
    });

    it('should use the correct sample rate', async () => {
      const int16Data = new Int16Array([0, 0]);
      const data = new Uint8Array(int16Data.buffer);

      await decodeAudioData(
        data,
        mockAudioContext as unknown as AudioContext,
        16000,
        1
      );

      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, 2, 16000);
    });

    it('should calculate correct frame count for multi-channel audio', async () => {
      // 8 Int16 samples = 4 frames for stereo
      const int16Data = new Int16Array([0, 0, 0, 0, 0, 0, 0, 0]);
      const data = new Uint8Array(int16Data.buffer);

      await decodeAudioData(
        data,
        mockAudioContext as unknown as AudioContext,
        48000,
        2
      );

      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(2, 4, 48000);
    });
  });

  describe('edge cases', () => {
    it('should handle encoding max byte values', () => {
      const bytes = new Uint8Array([255, 255, 255]);
      const encoded = encode(bytes);
      const decoded = decode(encoded);
      expect(Array.from(decoded)).toEqual([255, 255, 255]);
    });

    it('should handle encoding min byte values', () => {
      const bytes = new Uint8Array([0, 0, 0]);
      const encoded = encode(bytes);
      const decoded = decode(encoded);
      expect(Array.from(decoded)).toEqual([0, 0, 0]);
    });
  });
});
