
import { describe, it, expect, vi } from 'vitest';
import { logger } from './logger';

describe('Secure Logger', () => {
  it('should redact sensitive keys in objects', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const sensitiveData = {
      apiKey: 'secret123',
      user: 'jules',
      nested: {
        password: 'password123',
        public: 'visible'
      }
    };

    logger.error('Error occurred', sensitiveData);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error occurred',
      expect.objectContaining({
        apiKey: '***REDACTED***',
        user: 'jules',
        nested: expect.objectContaining({
            password: '***REDACTED***',
            public: 'visible'
        })
      })
    );

    consoleSpy.mockRestore();
  });

  it('should handle Error objects', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Something went wrong');
    (error as any).config = { headers: { Authorization: 'Bearer token' } };

    logger.error(error);

    expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
            message: 'Something went wrong',
            config: expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: '***REDACTED***'
                })
            })
        })
    );

    consoleSpy.mockRestore();
  });

  it('should handle circular references', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const circular: any = { name: 'circular' };
    circular.self = circular;

    logger.error(circular);

    expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
            name: 'circular',
            self: '[Circular]'
        })
    );
    consoleSpy.mockRestore();
  });

  it('should not redact non-sensitive keys that contain substring "key"', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const safeData = {
          keyboard: 'mechanical',
          publicKey: 'public_key_data' // Wait, privateKey is sensitive, publicKey might be ok?
          // My regex was /private[-_]?key/i. So publicKey should be fine unless I have /key/i?
          // I removed simple 'key' from SENSITIVE_PATTERNS.
      };

      logger.log(safeData);

      expect(consoleSpy).toHaveBeenCalledWith(
          expect.objectContaining({
              keyboard: 'mechanical',
              publicKey: 'public_key_data'
          })
      );
      consoleSpy.mockRestore();
  });
});
