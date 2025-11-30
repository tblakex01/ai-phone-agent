// PCM audio conversion constants
export const INT16_MAX = 32767;
export const INT16_MIN = -32768;
export const PCM_SCALE = 32768.0;

/**
 * Converts a Float32 audio sample (-1.0 to 1.0) to Int16 PCM format.
 * Applies scaling and clamping to prevent overflow.
 */
export function floatToPcmInt16(sample: number): number {
  const scaled = Math.round(sample * INT16_MAX);
  return Math.max(INT16_MIN, Math.min(INT16_MAX, scaled));
}

/**
 * Converts an Int16 PCM sample to Float32 (-1.0 to 1.0).
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
