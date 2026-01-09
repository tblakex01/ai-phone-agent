import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create mock functions that we can access
const mockGenerateContent = vi.fn();
const mockConnect = vi.fn();

// Mock the @google/genai module
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
      live: {
        connect: mockConnect,
      },
    })),
    Modality: {
      AUDIO: 'audio',
      TEXT: 'text',
    },
    LiveServerMessage: {},
  };
});

describe('geminiService', () => {
  let generateGreetingAudio: typeof import('./geminiService').generateGreetingAudio;
  let connectToLiveSession: typeof import('./geminiService').connectToLiveSession;

  beforeEach(async () => {
    // Clear mocks before each test
    mockGenerateContent.mockReset();
    mockConnect.mockReset();

    // Reset modules to get a fresh import each time
    vi.resetModules();

    // Re-import the service
    const service = await import('./geminiService');
    generateGreetingAudio = service.generateGreetingAudio;
    connectToLiveSession = service.connectToLiveSession;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateGreetingAudio', () => {
    it('should call the API with correct parameters', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    data: 'base64AudioData',
                  },
                },
              ],
            },
          },
        ],
      });

      const result = await generateGreetingAudio('Hello, world!', 'Kore');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: [{ parts: [{ text: 'Hello, world!' }] }],
          config: expect.objectContaining({
            responseModalities: ['audio'],
            speechConfig: expect.objectContaining({
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            }),
          }),
        })
      );
      expect(result).toBe('base64AudioData');
    });

    it('should throw error when no audio data is received', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        candidates: [],
      });

      await expect(
        generateGreetingAudio('Hello', 'Kore')
      ).rejects.toThrow('No audio data received from TTS API.');
    });

    it('should throw error when response has no inline data', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [{}],
            },
          },
        ],
      });

      await expect(
        generateGreetingAudio('Hello', 'Kore')
      ).rejects.toThrow('No audio data received from TTS API.');
    });

    it('should propagate API errors', async () => {
      const apiError = new Error('API rate limit exceeded');
      mockGenerateContent.mockRejectedValueOnce(apiError);

      await expect(
        generateGreetingAudio('Hello', 'Kore')
      ).rejects.toThrow('API rate limit exceeded');
    });

    it('should use different voice names', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ inlineData: { data: 'audio' } }],
            },
          },
        ],
      });

      const voices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

      for (const voice of voices) {
        await generateGreetingAudio('Test', voice);
        expect(mockGenerateContent).toHaveBeenLastCalledWith(
          expect.objectContaining({
            config: expect.objectContaining({
              speechConfig: expect.objectContaining({
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voice },
                },
              }),
            }),
          })
        );
      }
    });
  });

  describe('connectToLiveSession', () => {
    it('should call connect with correct parameters', () => {
      const callbacks = {
        onOpen: vi.fn(),
        onMessage: vi.fn(),
        onError: vi.fn(),
        onClose: vi.fn(),
      };

      const systemInstruction = 'You are a helpful assistant';
      const voiceName = 'Kore';

      mockConnect.mockReturnValue(Promise.resolve({ close: vi.fn() }));

      connectToLiveSession(callbacks, systemInstruction, voiceName);

      expect(mockConnect).toHaveBeenCalledWith(
        expect.objectContaining({
          callbacks: expect.objectContaining({
            onopen: callbacks.onOpen,
            onmessage: callbacks.onMessage,
            onerror: callbacks.onError,
            onclose: callbacks.onClose,
          }),
          config: expect.objectContaining({
            responseModalities: ['audio'],
            systemInstruction: 'You are a helpful assistant',
            speechConfig: expect.objectContaining({
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            }),
          }),
        })
      );
    });

    it('should configure audio transcription', () => {
      const callbacks = {
        onOpen: vi.fn(),
        onMessage: vi.fn(),
        onError: vi.fn(),
        onClose: vi.fn(),
      };

      mockConnect.mockReturnValue(Promise.resolve({ close: vi.fn() }));

      connectToLiveSession(callbacks, 'Test instruction', 'Puck');

      expect(mockConnect).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          }),
        })
      );
    });

    it('should return a promise from connect', () => {
      const mockSession = { close: vi.fn(), send: vi.fn() };
      mockConnect.mockReturnValue(Promise.resolve(mockSession));

      const callbacks = {
        onOpen: vi.fn(),
        onMessage: vi.fn(),
        onError: vi.fn(),
        onClose: vi.fn(),
      };

      const result = connectToLiveSession(callbacks, 'Test', 'Kore');

      expect(result).toBeInstanceOf(Promise);
    });

    it('should pass different voice options correctly', () => {
      const callbacks = {
        onOpen: vi.fn(),
        onMessage: vi.fn(),
        onError: vi.fn(),
        onClose: vi.fn(),
      };

      mockConnect.mockReturnValue(Promise.resolve({ close: vi.fn() }));

      connectToLiveSession(callbacks, 'Test', 'Fenrir');

      expect(mockConnect).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            speechConfig: expect.objectContaining({
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Fenrir' },
              },
            }),
          }),
        })
      );
    });
  });

  describe('error handling paths', () => {
    describe('generateGreetingAudio error scenarios', () => {
      it('should handle network timeout errors', async () => {
        const timeoutError = new Error('Network request timed out');
        timeoutError.name = 'TimeoutError';
        mockGenerateContent.mockRejectedValueOnce(timeoutError);

        await expect(
          generateGreetingAudio('Hello', 'Kore')
        ).rejects.toThrow('Network request timed out');
      });

      it('should handle API rate limit errors with status code', async () => {
        const rateLimitError = new Error('Rate limit exceeded');
        (rateLimitError as any).status = 429;
        (rateLimitError as any).statusText = 'Too Many Requests';
        mockGenerateContent.mockRejectedValueOnce(rateLimitError);

        await expect(
          generateGreetingAudio('Hello', 'Kore')
        ).rejects.toThrow('Rate limit exceeded');
      });

      it('should handle authentication failures', async () => {
        const authError = new Error('Invalid API key');
        (authError as any).status = 401;
        mockGenerateContent.mockRejectedValueOnce(authError);

        await expect(
          generateGreetingAudio('Hello', 'Kore')
        ).rejects.toThrow('Invalid API key');
      });

      it('should handle null candidates array', async () => {
        mockGenerateContent.mockResolvedValueOnce({
          candidates: null,
        });

        await expect(
          generateGreetingAudio('Hello', 'Kore')
        ).rejects.toThrow('No audio data received from TTS API.');
      });

      it('should handle undefined response', async () => {
        mockGenerateContent.mockResolvedValueOnce(undefined);

        await expect(
          generateGreetingAudio('Hello', 'Kore')
        ).rejects.toThrow();
      });

      it('should handle empty content in candidate', async () => {
        mockGenerateContent.mockResolvedValueOnce({
          candidates: [{ content: null }],
        });

        await expect(
          generateGreetingAudio('Hello', 'Kore')
        ).rejects.toThrow('No audio data received from TTS API.');
      });

      it('should handle empty parts array', async () => {
        mockGenerateContent.mockResolvedValueOnce({
          candidates: [
            {
              content: {
                parts: [],
              },
            },
          ],
        });

        await expect(
          generateGreetingAudio('Hello', 'Kore')
        ).rejects.toThrow('No audio data received from TTS API.');
      });

      it('should handle inlineData with empty data string', async () => {
        mockGenerateContent.mockResolvedValueOnce({
          candidates: [
            {
              content: {
                parts: [{ inlineData: { data: '' } }],
              },
            },
          ],
        });

        await expect(
          generateGreetingAudio('Hello', 'Kore')
        ).rejects.toThrow('No audio data received from TTS API.');
      });

      it('should handle server error (500)', async () => {
        const serverError = new Error('Internal server error');
        (serverError as any).status = 500;
        mockGenerateContent.mockRejectedValueOnce(serverError);

        await expect(
          generateGreetingAudio('Hello', 'Kore')
        ).rejects.toThrow('Internal server error');
      });

      it('should handle service unavailable (503)', async () => {
        const unavailableError = new Error('Service temporarily unavailable');
        (unavailableError as any).status = 503;
        mockGenerateContent.mockRejectedValueOnce(unavailableError);

        await expect(
          generateGreetingAudio('Hello', 'Kore')
        ).rejects.toThrow('Service temporarily unavailable');
      });
    });

    describe('connectToLiveSession error scenarios', () => {
      it('should handle connection rejection', async () => {
        const connectionError = new Error('Failed to establish WebSocket connection');
        mockConnect.mockRejectedValueOnce(connectionError);

        const callbacks = {
          onOpen: vi.fn(),
          onMessage: vi.fn(),
          onError: vi.fn(),
          onClose: vi.fn(),
        };

        const result = connectToLiveSession(callbacks, 'Test', 'Kore');

        await expect(result).rejects.toThrow('Failed to establish WebSocket connection');
      });

      it('should handle network failure during connection', async () => {
        const networkError = new Error('Network failure');
        networkError.name = 'NetworkError';
        mockConnect.mockRejectedValueOnce(networkError);

        const callbacks = {
          onOpen: vi.fn(),
          onMessage: vi.fn(),
          onError: vi.fn(),
          onClose: vi.fn(),
        };

        const result = connectToLiveSession(callbacks, 'Test', 'Kore');

        await expect(result).rejects.toThrow('Network failure');
      });

      it('should handle invalid API key during connection', async () => {
        const authError = new Error('API key invalid');
        (authError as any).code = 'AUTH_ERROR';
        mockConnect.mockRejectedValueOnce(authError);

        const callbacks = {
          onOpen: vi.fn(),
          onMessage: vi.fn(),
          onError: vi.fn(),
          onClose: vi.fn(),
        };

        const result = connectToLiveSession(callbacks, 'Test', 'Kore');

        await expect(result).rejects.toThrow('API key invalid');
      });

      it('should pass callbacks even when connection fails later', () => {
        const mockSession = {
          close: vi.fn(),
          send: vi.fn(),
        };
        mockConnect.mockReturnValue(Promise.resolve(mockSession));

        const callbacks = {
          onOpen: vi.fn(),
          onMessage: vi.fn(),
          onError: vi.fn(),
          onClose: vi.fn(),
        };

        connectToLiveSession(callbacks, 'Test instruction', 'Kore');

        expect(mockConnect).toHaveBeenCalledWith(
          expect.objectContaining({
            callbacks: expect.objectContaining({
              onopen: callbacks.onOpen,
              onmessage: callbacks.onMessage,
              onerror: callbacks.onError,
              onclose: callbacks.onClose,
            }),
          })
        );
      });

      it('should handle timeout during connection', async () => {
        const timeoutError = new Error('Connection timed out');
        timeoutError.name = 'TimeoutError';
        mockConnect.mockRejectedValueOnce(timeoutError);

        const callbacks = {
          onOpen: vi.fn(),
          onMessage: vi.fn(),
          onError: vi.fn(),
          onClose: vi.fn(),
        };

        const result = connectToLiveSession(callbacks, 'Test', 'Kore');

        await expect(result).rejects.toThrow('Connection timed out');
      });
    });
  });
});
