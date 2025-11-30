/**
 * PCM audio conversion constants.
 *
 * The mapping is intentionally asymmetric:
 * - Float samples in [-1.0, 1.0] are scaled using INT16_MAX.
 * - +1.0 maps to INT16_MAX (32767).
 * - -1.0 maps to -INT16_MAX (-32767); INT16_MIN is never produced by normal mapping.
 *
 * PCM_SCALE is derived from INT16_MAX so that floatToPcmInt16 and
 * pcmInt16ToFloat use the same normalization base and round-trip consistently.
 *
 * Values outside [-1.0, 1.0] are clamped to [INT16_MIN, INT16_MAX], allowing
 * INT16_MIN to appear only for out-of-range inputs.
 */
export const INT16_MAX = 32767;
export const INT16_MIN = -32768;
// Normalization factor for Int16 <-> float conversions (equal to INT16_MAX for symmetric round-trip).
export const PCM_SCALE = INT16_MAX;

/**
 * Converts a Float32 audio sample (-1.0 to 1.0) to Int16 PCM format.
 *
 * Uses INT16_MAX as the scale factor so that:
 *   0.0  -> 0
 *   1.0  -> INT16_MAX (32767)
 *  -1.0  -> -INT16_MAX (-32767); INT16_MIN is not produced by this mapping
 *
 * Values outside [-1.0, 1.0] are clamped to [INT16_MIN, INT16_MAX].
 *
 * Note on rounding: JavaScript's Math.round uses "round half away from zero"
 * for positive numbers but "round half towards +∞" for negative numbers.
 * For example: Math.round(0.5) = 1, Math.round(-0.5) = 0.
 */
export function floatToPcmInt16(sample: number): number {
  const scaled = Math.round(sample * INT16_MAX);
  return Math.max(INT16_MIN, Math.min(INT16_MAX, scaled));
}

/**
 * Converts an Int16 PCM sample to Float32 (-1.0 to 1.0).
 *
 * Uses PCM_SCALE (equal to INT16_MAX) for normalization, ensuring symmetric
 * round-trip behavior with floatToPcmInt16.
 */
export function pcmInt16ToFloat(sample: number): number {
  return sample / PCM_SCALE;
}

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = pcmInt16ToFloat(dataInt16[i * numChannels + channel]);
    }
  }
  return buffer;
}
