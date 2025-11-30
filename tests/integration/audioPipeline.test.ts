import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encode, decode, decodeAudioData, floatToPcmInt16, INT16_MAX, INT16_MIN, PCM_SCALE } from '../../utils/audioUtils';

/**
 * Integration tests for the audio pipeline
 * Tests the full flow of audio data through encoding, transmission simulation,
 * and decoding processes.
 */
describe('Audio Pipeline Integration', () => {
  describe('encode -> decode roundtrip', () => {
    it('should correctly handle PCM audio data roundtrip', () => {
      // Simulate 1 second of mono audio at 16kHz (16000 samples)
      const sampleRate = 16000;
      const duration = 0.1; // 100ms for faster test
      const numSamples = sampleRate * duration;

      // Generate a sine wave (440Hz tone)
      const int16Samples = new Int16Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const amplitude = 16000; // Leave headroom
        int16Samples[i] = Math.floor(amplitude * Math.sin(2 * Math.PI * 440 * t));
      }

      // Convert to Uint8Array (as it would be for transmission)
      const bytes = new Uint8Array(int16Samples.buffer);

      // Encode to base64 (simulating network transmission)
      const base64 = encode(bytes);

      // Verify base64 is valid
      expect(base64.length).toBeGreaterThan(0);
      expect(() => atob(base64)).not.toThrow();

      // Decode back from base64
      const decodedBytes = decode(base64);

      // Verify the decoded data matches original
      expect(decodedBytes.length).toBe(bytes.length);
      expect(Array.from(decodedBytes)).toEqual(Array.from(bytes));

      // Reconstruct Int16Array and verify samples
      const reconstructedSamples = new Int16Array(decodedBytes.buffer);
      expect(reconstructedSamples.length).toBe(int16Samples.length);

      // Verify samples match
      for (let i = 0; i < int16Samples.length; i++) {
        expect(reconstructedSamples[i]).toBe(int16Samples[i]);
      }
    });

    it('should handle stereo audio data', () => {
      const sampleRate = 24000;
      const numChannels = 2;
      const framesPerChannel = 100;

      // Interleaved stereo: L R L R L R ...
      // Start from index 1 to avoid -0 vs +0 comparison issues
      const int16Samples = new Int16Array(framesPerChannel * numChannels);
      for (let i = 0; i < framesPerChannel; i++) {
        int16Samples[i * 2] = (i + 1) * 100; // Left channel
        int16Samples[i * 2 + 1] = -(i + 1) * 100; // Right channel (inverted)
      }

      const bytes = new Uint8Array(int16Samples.buffer);
      const base64 = encode(bytes);
      const decoded = decode(base64);
      const reconstructed = new Int16Array(decoded.buffer);

      expect(reconstructed.length).toBe(int16Samples.length);

      // Verify channel separation
      for (let i = 0; i < framesPerChannel; i++) {
        expect(reconstructed[i * 2]).toBe((i + 1) * 100); // Left
        expect(reconstructed[i * 2 + 1]).toBe(-(i + 1) * 100); // Right
      }
    });

    it('should preserve audio dynamics (quiet to loud)', () => {
      // Test full dynamic range
      const samples = new Int16Array([
        0, // Silence
        1, // Very quiet
        100, // Quiet
        1000, // Medium
        16000, // Loud
        INT16_MAX, // Maximum positive
        -1, // Very quiet negative
        -100, // Quiet negative
        -16000, // Loud negative
        INT16_MIN, // Maximum negative
      ]);

      const bytes = new Uint8Array(samples.buffer);
      const base64 = encode(bytes);
      const decoded = decode(base64);
      const reconstructed = new Int16Array(decoded.buffer);

      expect(Array.from(reconstructed)).toEqual(Array.from(samples));
    });
  });

  describe('decodeAudioData integration', () => {
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

    it('should correctly convert Int16 PCM to normalized Float32', async () => {
      // Create known Int16 values
      const int16Samples = new Int16Array([
        0, // Should become 0.0
        16384, // Should become ~0.5
        INT16_MAX, // Should become ~1.0
        -16384, // Should become ~-0.5
        INT16_MIN, // Should become -1.0
      ]);

      const bytes = new Uint8Array(int16Samples.buffer);

      // Capture the actual Float32 data written
      const capturedData = new Float32Array(5);
      mockAudioContext.createBuffer = vi.fn(() => ({
        getChannelData: () => capturedData,
      }));

      await decodeAudioData(
        bytes,
        mockAudioContext as unknown as AudioContext,
        24000,
        1
      );

      // Verify normalization
      expect(capturedData[0]).toBeCloseTo(0, 4);
      expect(capturedData[1]).toBeCloseTo(0.5, 2);
      expect(capturedData[2]).toBeCloseTo(1.0, 2);
      expect(capturedData[3]).toBeCloseTo(-0.5, 2);
      expect(capturedData[4]).toBeCloseTo(-1.0, 2);
    });

    it('should handle the full pipeline: encode -> network -> decode -> AudioBuffer', async () => {
      // Generate audio data
      const originalInt16 = new Int16Array([1000, -1000, 2000, -2000]);
      const originalBytes = new Uint8Array(originalInt16.buffer);

      // Step 1: Encode for transmission
      const base64 = encode(originalBytes);

      // Step 2: Simulate network transmission (base64 string)
      const receivedBase64 = base64; // In real app, this comes from server

      // Step 3: Decode from base64
      const receivedBytes = decode(receivedBase64);

      // Step 4: Convert to AudioBuffer
      const capturedData = new Float32Array(4);
      mockAudioContext.createBuffer = vi.fn(() => ({
        getChannelData: () => capturedData,
      }));

      await decodeAudioData(
        receivedBytes,
        mockAudioContext as unknown as AudioContext,
        24000,
        1
      );

      // Verify the pipeline preserved the audio correctly
      expect(capturedData[0]).toBeCloseTo(1000 / PCM_SCALE, 4);
      expect(capturedData[1]).toBeCloseTo(-1000 / PCM_SCALE, 4);
      expect(capturedData[2]).toBeCloseTo(2000 / PCM_SCALE, 4);
      expect(capturedData[3]).toBeCloseTo(-2000 / PCM_SCALE, 4);
    });
  });

  describe('microphone input simulation', () => {
    it('should correctly encode microphone Float32 input to PCM with clamping', () => {
      // Simulate Float32 data from microphone (range -1.0 to 1.0)
      const microphoneData = new Float32Array([0, 0.5, 1.0, -0.5, -1.0]);

      // Convert to Int16 using the shared helper function (same as CallScreen.tsx)
      const int16Data = new Int16Array(microphoneData.map(floatToPcmInt16));

      // Convert to bytes and encode
      const bytes = new Uint8Array(int16Data.buffer);
      const base64 = encode(bytes);

      // Verify encoding works
      expect(base64.length).toBeGreaterThan(0);

      // Decode and verify
      const decoded = decode(base64);
      const reconstructedInt16 = new Int16Array(decoded.buffer);

      // Check all values - clamping ensures no overflow at boundary values
      // Note: Math.round(-16383.5) = -16383 in JS (rounds towards +∞ for .5)
      expect(reconstructedInt16[0]).toBe(0);           // 0 * INT16_MAX = 0
      expect(reconstructedInt16[1]).toBe(16384);       // 0.5 * INT16_MAX = 16383.5 → 16384
      expect(reconstructedInt16[2]).toBe(INT16_MAX);   // 1.0 * INT16_MAX = INT16_MAX (clamped to max)
      expect(reconstructedInt16[3]).toBe(-16383);      // -0.5 * INT16_MAX = -16383.5 → -16383
      expect(reconstructedInt16[4]).toBe(-INT16_MAX);  // -1.0 * INT16_MAX = -INT16_MAX
    });

    it('should handle clipping at maximum values', () => {
      // Values outside normal range [-1.0, 1.0] that would overflow if not clamped
      const inputData = new Float32Array([1.5, -1.5, 2.0, -2.0]);

      // Use the shared helper function (same as CallScreen.tsx)
      const clampedInt16 = new Int16Array(inputData.map(floatToPcmInt16));

      expect(clampedInt16[0]).toBe(INT16_MAX);  // 1.5 * INT16_MAX = 49151, clamped to INT16_MAX
      expect(clampedInt16[1]).toBe(INT16_MIN);  // -1.5 * INT16_MAX = -49151, clamped to INT16_MIN
      expect(clampedInt16[2]).toBe(INT16_MAX);  // 2.0 * INT16_MAX = 65534, clamped to INT16_MAX
      expect(clampedInt16[3]).toBe(INT16_MIN);  // -2.0 * INT16_MAX = -65534, clamped to INT16_MIN
    });
  });

  describe('audio queue processing simulation', () => {
    it('should handle multiple audio chunks in sequence', () => {
      const chunks: string[] = [];

      // Simulate receiving multiple audio chunks
      for (let i = 0; i < 5; i++) {
        const samples = new Int16Array(100);
        samples.fill(i * 1000); // Different amplitude per chunk
        const bytes = new Uint8Array(samples.buffer);
        chunks.push(encode(bytes));
      }

      // Process chunks in order
      const processedChunks = chunks.map((base64, index) => {
        const decoded = decode(base64);
        const samples = new Int16Array(decoded.buffer);

        // Verify each chunk
        expect(samples[0]).toBe(index * 1000);

        return {
          index,
          sampleCount: samples.length,
          firstSample: samples[0],
        };
      });

      expect(processedChunks).toHaveLength(5);
      expect(processedChunks[0].firstSample).toBe(0);
      expect(processedChunks[4].firstSample).toBe(4000);
    });

    it('should handle empty chunks gracefully', () => {
      const emptyBytes = new Uint8Array(0);
      const base64 = encode(emptyBytes);
      const decoded = decode(base64);

      expect(decoded.length).toBe(0);
    });

    it('should handle very small chunks', () => {
      // Single sample (2 bytes for Int16)
      const singleSample = new Int16Array([12345]);
      const bytes = new Uint8Array(singleSample.buffer);
      const base64 = encode(bytes);
      const decoded = decode(base64);
      const reconstructed = new Int16Array(decoded.buffer);

      expect(reconstructed[0]).toBe(12345);
    });
  });

  describe('sample rate handling', () => {
    it('should handle 16kHz input sample rate', async () => {
      const sampleRate = 16000;
      const samples = new Int16Array(sampleRate); // 1 second of audio
      const bytes = new Uint8Array(samples.buffer);

      const mockContext = {
        createBuffer: vi.fn((channels, frameCount, rate) => ({
          numberOfChannels: channels,
          length: frameCount,
          sampleRate: rate,
          duration: frameCount / rate,
          getChannelData: () => new Float32Array(frameCount),
        })),
      };

      const buffer = await decodeAudioData(
        bytes,
        mockContext as unknown as AudioContext,
        sampleRate,
        1
      );

      expect(mockContext.createBuffer).toHaveBeenCalledWith(1, sampleRate, sampleRate);
    });

    it('should handle 24kHz output sample rate', async () => {
      const sampleRate = 24000;
      const samples = new Int16Array(sampleRate); // 1 second
      const bytes = new Uint8Array(samples.buffer);

      const mockContext = {
        createBuffer: vi.fn((channels, frameCount, rate) => ({
          numberOfChannels: channels,
          length: frameCount,
          sampleRate: rate,
          duration: frameCount / rate,
          getChannelData: () => new Float32Array(frameCount),
        })),
      };

      const buffer = await decodeAudioData(
        bytes,
        mockContext as unknown as AudioContext,
        sampleRate,
        1
      );

      expect(mockContext.createBuffer).toHaveBeenCalledWith(1, sampleRate, sampleRate);
    });
  });

  describe('error resilience', () => {
    it('should handle corrupted base64 gracefully', () => {
      // Invalid base64 should throw
      expect(() => decode('not-valid-base64!!!')).toThrow();
    });

    it('should throw error for misaligned byte data', async () => {
      // Int16 requires even number of bytes
      // Odd number of bytes should throw a RangeError
      const oddBytes = new Uint8Array([1, 2, 3]); // 3 bytes

      const mockContext = {
        createBuffer: vi.fn((channels, frameCount, rate) => ({
          getChannelData: () => new Float32Array(frameCount),
        })),
      };

      // This should throw because Int16Array requires even byte length
      await expect(
        decodeAudioData(
          oddBytes,
          mockContext as unknown as AudioContext,
          24000,
          1
        )
      ).rejects.toThrow();
    });

    it('should handle even byte aligned data correctly', async () => {
      // Valid even byte length (4 bytes = 2 Int16 samples)
      const evenBytes = new Uint8Array([1, 2, 3, 4]);

      const mockContext = {
        createBuffer: vi.fn((channels, frameCount, rate) => ({
          getChannelData: () => new Float32Array(frameCount),
        })),
      };

      // This should work fine
      await decodeAudioData(
        evenBytes,
        mockContext as unknown as AudioContext,
        24000,
        1
      );

      expect(mockContext.createBuffer).toHaveBeenCalledWith(1, 2, 24000);
    });
  });

  describe('performance characteristics', () => {
    it('should encode large audio buffers efficiently', () => {
      // 5 seconds of audio at 24kHz
      const sampleCount = 24000 * 5;
      const samples = new Int16Array(sampleCount);

      // Fill with some data
      for (let i = 0; i < sampleCount; i++) {
        samples[i] = Math.floor(Math.sin(i / 100) * 10000);
      }

      const bytes = new Uint8Array(samples.buffer);

      const startTime = performance.now();
      const base64 = encode(bytes);
      const encodeTime = performance.now() - startTime;

      // Should complete in reasonable time (< 100ms for most systems)
      expect(encodeTime).toBeLessThan(1000);
      expect(base64.length).toBeGreaterThan(0);
    });

    it('should decode large audio buffers efficiently', () => {
      // Create large base64 data
      const sampleCount = 24000 * 5;
      const samples = new Int16Array(sampleCount);
      const bytes = new Uint8Array(samples.buffer);
      const base64 = encode(bytes);

      const startTime = performance.now();
      const decoded = decode(base64);
      const decodeTime = performance.now() - startTime;

      expect(decodeTime).toBeLessThan(1000);
      expect(decoded.length).toBe(bytes.length);
    });
  });
});
