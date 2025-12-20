
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('Logger Security', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should redact sensitive keys in objects', () => {
    logger.log({ apiKey: 'secret123', publicInfo: 'public' });
    expect(console.log).toHaveBeenCalledWith({ apiKey: '***REDACTED***', publicInfo: 'public' });
  });

  it('should redact API keys in strings', () => {
    const secret = 'AIzaSyD-1234567890abcdefghijklmnopqrstu'; // AIza + 35 chars
    logger.error(`Failed with key ${secret}`);

    // Check that the secret is NOT present
    const lastCall = vi.mocked(console.error).mock.lastCall;
    expect(lastCall?.[0]).not.toContain(secret);

    // Check that it IS redacted
    expect(lastCall?.[0]).toContain('***REDACTED***');
  });

  it('should redact API keys in object values even if key is not sensitive', () => {
    const secret = 'AIzaSyD-1234567890abcdefghijklmnopqrstu';
    logger.info({ url: `https://api.google.com?key=${secret}` });

    const lastCall = vi.mocked(console.info).mock.lastCall;
    const loggedObj = lastCall?.[0];

    expect(loggedObj.url).not.toContain(secret);
    expect(loggedObj.url).toContain('***REDACTED***');
  });

  it('should redact API keys in Error messages', () => {
      const secret = 'AIzaSyD-1234567890abcdefghijklmnopqrstu';
      const error = new Error(`Request failed: ${secret}`);
      logger.error("Error occurred", error);

      const lastCall = vi.mocked(console.error).mock.lastCall;
      // console.error was called with ("Error occurred", { message: ... })
      const loggedError = lastCall?.[1];

      expect(loggedError.message).not.toContain(secret);
      expect(loggedError.message).toContain('***REDACTED***');
  });
});
