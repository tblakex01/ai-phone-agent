import { describe, it, expect, vi, beforeEach } from 'vitest';
import { decode, encode, decodeAudioData, floatToPcmInt16, pcmInt16ToFloat, INT16_MAX, INT16_MIN, PCM_SCALE } from './audioUtils';

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
      const int16Data = new Int16Array([0, 1000, -1000, INT16_MAX, INT16_MIN]);
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
      const int16Data = new Int16Array([0, 16384, INT16_MAX, INT16_MIN, -16384]);
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

      const buffer = await decodeAudioData(
        data,
        mockAudioContext as unknown as AudioContext,
        24000,
        2
      );

      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(2, 3, 24000);
    });

    it('should normalize Int16 values to Float32 range', async () => {
      // Max positive: INT16_MAX -> ~1.0
      // Max negative: INT16_MIN -> -1.0
      const int16Data = new Int16Array([INT16_MAX, INT16_MIN, 0]);
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
      expect(capturedChannelData[0]).toBeCloseTo(INT16_MAX / PCM_SCALE, 4);
      expect(capturedChannelData[1]).toBeCloseTo(INT16_MIN / PCM_SCALE, 4);
      expect(capturedChannelData[2]).toBe(0);
    });

    it('should handle empty audio data', async () => {
      const data = new Uint8Array(0);

      const buffer = await decodeAudioData(
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

    it('should correctly decode when Uint8Array is a subarray/view of a larger buffer', async () => {
      // Create a larger buffer with padding data on both sides
      const paddingBefore = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]); // 4 bytes padding
      const int16Data = new Int16Array([1000, -1000, 2000]); // 3 samples = 6 bytes
      const paddingAfter = new Uint8Array([0xAA, 0xAA, 0xAA, 0xAA]); // 4 bytes padding

      // Combine into a single larger buffer
      const fullBuffer = new Uint8Array(paddingBefore.length + int16Data.byteLength + paddingAfter.length);
      fullBuffer.set(paddingBefore, 0);
      fullBuffer.set(new Uint8Array(int16Data.buffer), paddingBefore.length);
      fullBuffer.set(paddingAfter, paddingBefore.length + int16Data.byteLength);

      // Create a subarray view that only points to the int16 data portion
      const subarray = fullBuffer.subarray(paddingBefore.length, paddingBefore.length + int16Data.byteLength);

      // Verify it's actually a view into the larger buffer
      expect(subarray.buffer.byteLength).toBe(fullBuffer.byteLength);
      expect(subarray.byteOffset).toBe(paddingBefore.length);
      expect(subarray.byteLength).toBe(int16Data.byteLength);

      const capturedChannelData = new Float32Array(3);
      mockAudioContext.createBuffer = vi.fn(() => ({
        getChannelData: vi.fn(() => capturedChannelData),
      }));

      await decodeAudioData(
        subarray,
        mockAudioContext as unknown as AudioContext,
        24000,
        1
      );

      // Should decode only the subarray portion, not the padding
      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, 3, 24000);
      expect(capturedChannelData[0]).toBeCloseTo(1000 / PCM_SCALE, 4);
      expect(capturedChannelData[1]).toBeCloseTo(-1000 / PCM_SCALE, 4);
      expect(capturedChannelData[2]).toBeCloseTo(2000 / PCM_SCALE, 4);
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

  describe('floatToPcmInt16', () => {
    it('should convert 0.0 to 0', () => {
      expect(floatToPcmInt16(0)).toBe(0);
    });

    it('should convert 1.0 to INT16_MAX', () => {
      expect(floatToPcmInt16(1.0)).toBe(INT16_MAX);
    });

    it('should convert -1.0 to -INT16_MAX', () => {
      expect(floatToPcmInt16(-1.0)).toBe(-INT16_MAX);
    });

    it('should convert 0.5 to approximately half of INT16_MAX', () => {
      expect(floatToPcmInt16(0.5)).toBe(16384);
    });

    it('should clamp values greater than 1.0 to INT16_MAX', () => {
      expect(floatToPcmInt16(1.5)).toBe(INT16_MAX);
      expect(floatToPcmInt16(2.0)).toBe(INT16_MAX);
    });

    it('should clamp values less than -1.0 to INT16_MIN', () => {
      expect(floatToPcmInt16(-1.5)).toBe(INT16_MIN);
      expect(floatToPcmInt16(-2.0)).toBe(INT16_MIN);
    });
  });

  describe('pcmInt16ToFloat', () => {
    it('should convert 0 to 0.0', () => {
      expect(pcmInt16ToFloat(0)).toBe(0);
    });

    it('should convert INT16_MAX to approximately 1.0', () => {
      expect(pcmInt16ToFloat(INT16_MAX)).toBeCloseTo(1.0, 2);
    });

    it('should convert INT16_MIN to approximately -1.0', () => {
      // With PCM_SCALE = INT16_MAX (32767), INT16_MIN (-32768) converts to
      // slightly less than -1.0. This is intentional for symmetric round-trip.
      expect(pcmInt16ToFloat(INT16_MIN)).toBeCloseTo(-1.0, 4);
    });

    it('should convert 16384 to approximately 0.5', () => {
      expect(pcmInt16ToFloat(16384)).toBeCloseTo(0.5, 2);
    });
  });

  describe('floatToPcmInt16 and pcmInt16ToFloat roundtrip', () => {
    it('should approximately roundtrip standard values', () => {
      const testValues = [0, 0.5, -0.5, 0.25, -0.25];
      for (const value of testValues) {
        const int16 = floatToPcmInt16(value);
        const back = pcmInt16ToFloat(int16);
        expect(back).toBeCloseTo(value, 2);
      }
    });
  });
});
