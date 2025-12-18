import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Polyfill for TextEncoder/TextDecoder (needed for React 19)
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Mock import.meta.env
// In Vitest + Vite environment, import.meta.env is usually available, but we can explicitly set it to be sure
// or if we are running in an environment where it's not fully populated.
// Note: We can't easily assign to import.meta, so we rely on Vite's transform or Vitest's define.
// However, since we are moving away from process.env, we can clean up the process.env mock.

const originalProcess = process;
vi.stubGlobal('process', {
  ...originalProcess,
  env: {
    ...originalProcess.env,
    // We keep these for now just in case some third-party lib relies on them, but our app code uses import.meta.env
  },
});

// Since we can't easily stub import.meta.env in jsdom (it's a syntax feature),
// we rely on vite.config.ts define or Vitest environment.
// However, in tests, if we need to mock different values for env vars, we might need a workaround.
// For now, we assume the values from vite.config.ts or defaults are sufficient.
// To ensure tests pass if they rely on specific keys:
// We can use vi.stubEnv if we were using process.env, but for import.meta.env it's harder.
// Fortunately, the previous tests passed, implying import.meta.env is working.

// Mock AudioContext
class MockAudioContext {
  sampleRate = 24000;
  currentTime = 0;
  state = 'running';
  destination = {};

  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: vi.fn(() => new Float32Array(length)),
    };
  }

  createBufferSource() {
    return {
      buffer: null as any,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null as (() => void) | null,
    };
  }

  createMediaStreamSource() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createScriptProcessor() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      onaudioprocess: null as ((event: any) => void) | null,
    };
  }

  close() {
    return Promise.resolve();
  }

  resume() {
    return Promise.resolve();
  }
}

vi.stubGlobal('AudioContext', MockAudioContext);
vi.stubGlobal('webkitAudioContext', MockAudioContext);

// Mock navigator.mediaDevices
const mockMediaStream = {
  getTracks: vi.fn(() => [{ stop: vi.fn() }]),
};

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn(() => Promise.resolve(mockMediaStream)),
  },
  writable: true,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
vi.stubGlobal('ResizeObserver', class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
});

// Mock requestAnimationFrame (needed for React)
// Cast to number since browser setTimeout returns number, but Node.js returns Timeout
global.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(callback, 0) as unknown as number;
});

global.cancelAnimationFrame = vi.fn((id: number) => {
  clearTimeout(id);
});

// Mock structuredClone if not available
if (typeof structuredClone === 'undefined') {
  global.structuredClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));
}
