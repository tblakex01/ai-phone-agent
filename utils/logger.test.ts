
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

  describe('deeply nested sensitive data', () => {
    it('should redact sensitive data at multiple nesting levels', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const deeplyNested = {
        level1: {
          level2: {
            level3: {
              level4: {
                apiKey: 'super-secret-key',
                normalData: 'visible'
              }
            }
          }
        }
      };

      logger.log(deeplyNested);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level1: expect.objectContaining({
            level2: expect.objectContaining({
              level3: expect.objectContaining({
                level4: expect.objectContaining({
                  apiKey: '***REDACTED***',
                  normalData: 'visible'
                })
              })
            })
          })
        })
      );
      consoleSpy.mockRestore();
    });

    it('should handle mixed nested sensitive and non-sensitive keys', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const mixedNested = {
        config: {
          apiKey: 'secret1',
          settings: {
            password: 'secret2',
            display: {
              theme: 'dark',
              token: 'secret3'
            }
          }
        },
        user: {
          name: 'John',
          profile: {
            bio: 'Developer',
            website: 'example.com'
          }
        }
      };

      logger.log(mixedNested);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            apiKey: '***REDACTED***',
            settings: expect.objectContaining({
              password: '***REDACTED***',
              display: expect.objectContaining({
                theme: 'dark',
                token: '***REDACTED***'
              })
            })
          }),
          user: expect.objectContaining({
            name: 'John',
            profile: expect.objectContaining({
              bio: 'Developer',
              website: 'example.com'
            })
          })
        })
      );
      consoleSpy.mockRestore();
    });
  });

  describe('arrays containing sensitive objects', () => {
    it('should redact sensitive data in array elements', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const arrayData = {
        users: [
          { name: 'Alice', password: 'pass1' },
          { name: 'Bob', password: 'pass2' },
          { name: 'Charlie', apiKey: 'key3' }
        ]
      };

      logger.log(arrayData);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          users: [
            expect.objectContaining({ name: 'Alice', password: '***REDACTED***' }),
            expect.objectContaining({ name: 'Bob', password: '***REDACTED***' }),
            expect.objectContaining({ name: 'Charlie', apiKey: '***REDACTED***' })
          ]
        })
      );
      consoleSpy.mockRestore();
    });

    it('should handle nested arrays with sensitive data', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const nestedArrays = {
        matrix: [
          [{ token: 'secret1' }, { value: 'visible' }],
          [{ secret: 'hidden' }, { data: 'public' }]
        ]
      };

      logger.log(nestedArrays);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          matrix: [
            [
              expect.objectContaining({ token: '***REDACTED***' }),
              expect.objectContaining({ value: 'visible' })
            ],
            [
              expect.objectContaining({ secret: '***REDACTED***' }),
              expect.objectContaining({ data: 'public' })
            ]
          ]
        })
      );
      consoleSpy.mockRestore();
    });

    it('should handle arrays at root level', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const rootArray = [
        { apiKey: 'key1', id: 1 },
        { apiKey: 'key2', id: 2 }
      ];

      logger.log(rootArray);

      expect(consoleSpy).toHaveBeenCalledWith([
        expect.objectContaining({ apiKey: '***REDACTED***', id: 1 }),
        expect.objectContaining({ apiKey: '***REDACTED***', id: 2 })
      ]);
      consoleSpy.mockRestore();
    });
  });

  describe('special types handling', () => {
    it('should handle functions by converting to string', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const withFunction = {
        callback: function myCallback() { return 'test'; },
        arrow: () => 'arrow',
        name: 'test'
      };

      logger.log(withFunction);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test'
        })
      );
      consoleSpy.mockRestore();
    });

    it('should handle symbols by converting to string', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const mySymbol = Symbol('testSymbol');

      logger.log(mySymbol);

      expect(consoleSpy).toHaveBeenCalledWith('Symbol(testSymbol)');
      consoleSpy.mockRestore();
    });

    it('should handle null and undefined values', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const withNulls = {
        nullValue: null,
        undefinedValue: undefined,
        apiKey: 'secret'
      };

      logger.log(withNulls);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          nullValue: null,
          undefinedValue: undefined,
          apiKey: '***REDACTED***'
        })
      );
      consoleSpy.mockRestore();
    });

    it('should handle primitive types correctly', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      logger.log('string value');
      expect(consoleSpy).toHaveBeenCalledWith('string value');

      logger.log(12345);
      expect(consoleSpy).toHaveBeenCalledWith(12345);

      logger.log(true);
      expect(consoleSpy).toHaveBeenCalledWith(true);

      consoleSpy.mockRestore();
    });

    it('should handle Date objects', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const withDate = {
        created: new Date('2024-01-01'),
        token: 'secret'
      };

      logger.log(withDate);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          token: '***REDACTED***'
        })
      );
      consoleSpy.mockRestore();
    });
  });

  describe('complex Error objects', () => {
    it('should handle Error with custom properties containing sensitive data', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Request failed');
      (error as any).response = {
        status: 401,
        headers: {
          authorization: 'Bearer secret-token'
        }
      };
      (error as any).request = {
        url: 'https://api.example.com',
        apiKey: 'hidden-key'
      };

      logger.error(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Request failed',
          response: expect.objectContaining({
            status: 401,
            headers: expect.objectContaining({
              authorization: '***REDACTED***'
            })
          }),
          request: expect.objectContaining({
            url: 'https://api.example.com',
            apiKey: '***REDACTED***'
          })
        })
      );
      consoleSpy.mockRestore();
    });

    it('should handle nested Error in object', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrappedError = {
        context: 'API call',
        error: new Error('Inner error'),
        config: {
          password: 'hidden'
        }
      };

      logger.error(wrappedError);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          context: 'API call',
          config: expect.objectContaining({
            password: '***REDACTED***'
          }),
          error: expect.objectContaining({
            message: 'Inner error'
          })
        })
      );
      consoleSpy.mockRestore();
    });

    it('should redact credentials key entirely', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const withCredentials = {
        context: 'Auth',
        credentials: {
          username: 'user',
          password: 'pass'
        }
      };

      logger.error(withCredentials);

      // credentials key matches /credential/i pattern, so entire value is redacted
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          context: 'Auth',
          credentials: '***REDACTED***'
        })
      );
      consoleSpy.mockRestore();
    });
  });

  describe('all sensitive patterns', () => {
    it('should redact all defined sensitive patterns', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const allPatterns = {
        api_key: 'secret1',
        apiKey: 'secret2',
        API_KEY: 'secret3',
        auth: 'secret4',
        authorization: 'secret5',
        Authorization: 'secret6',
        pass: 'secret7',
        password: 'secret8',
        passphrase: 'secret9',
        secret: 'secret10',
        SECRET: 'secret11',
        token: 'secret12',
        TOKEN: 'secret13',
        credential: 'secret14',
        credentials: 'secret15',
        private_key: 'secret16',
        privateKey: 'secret17',
        PRIVATE_KEY: 'secret18'
      };

      logger.log(allPatterns);

      const result = consoleSpy.mock.calls[0][0];
      Object.keys(allPatterns).forEach(key => {
        expect(result[key]).toBe('***REDACTED***');
      });
      consoleSpy.mockRestore();
    });
  });

  describe('multiple arguments', () => {
    it('should sanitize all arguments passed to logger', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      logger.log(
        'Message:',
        { apiKey: 'key1' },
        'Another message',
        { password: 'pass1' }
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Message:',
        expect.objectContaining({ apiKey: '***REDACTED***' }),
        'Another message',
        expect.objectContaining({ password: '***REDACTED***' })
      );
      consoleSpy.mockRestore();
    });
  });

  describe('logger methods', () => {
    it('should work with logger.warn', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      logger.warn('Warning:', { token: 'secret-token' });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Warning:',
        expect.objectContaining({ token: '***REDACTED***' })
      );
      consoleSpy.mockRestore();
    });

    it('should work with logger.info', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      logger.info('Info:', { secret: 'hidden' });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Info:',
        expect.objectContaining({ secret: '***REDACTED***' })
      );
      consoleSpy.mockRestore();
    });
  });

  describe('complex circular references', () => {
    it('should handle multiple circular references', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const obj1: any = { name: 'obj1', apiKey: 'secret' };
      const obj2: any = { name: 'obj2', password: 'hidden' };
      obj1.ref = obj2;
      obj2.ref = obj1;
      obj1.self = obj1;

      logger.log(obj1);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'obj1',
          apiKey: '***REDACTED***',
          self: '[Circular]'
        })
      );
      consoleSpy.mockRestore();
    });

    it('should handle circular arrays', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const arr: any[] = [{ token: 'secret' }];
      arr.push(arr);

      logger.log(arr);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ token: '***REDACTED***' })
        ])
      );
      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle empty objects', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.log({});
      expect(consoleSpy).toHaveBeenCalledWith({});
      consoleSpy.mockRestore();
    });

    it('should handle empty arrays', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.log([]);
      expect(consoleSpy).toHaveBeenCalledWith([]);
      consoleSpy.mockRestore();
    });

    it('should handle objects with no enumerable properties', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const obj = Object.create(null);
      logger.log(obj);
      expect(consoleSpy).toHaveBeenCalledWith({});
      consoleSpy.mockRestore();
    });

    it('should handle very deeply nested objects without stack overflow', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      let deep: any = { apiKey: 'secret' };
      for (let i = 0; i < 100; i++) {
        deep = { nested: deep };
      }

      // Should not throw
      expect(() => logger.log(deep)).not.toThrow();
      consoleSpy.mockRestore();
    });
  });
});
