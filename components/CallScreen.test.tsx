import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CallScreen from './CallScreen';
import { PersonaConfig } from '../types';
import * as geminiService from '../services/geminiService';

// Mock the geminiService
vi.mock('../services/geminiService', () => ({
  generateGreetingAudio: vi.fn(),
  connectToLiveSession: vi.fn(),
}));

// Mock audioUtils
vi.mock('../utils/audioUtils', () => ({
  decode: vi.fn((base64: string) => new Uint8Array([0, 0, 0, 0])),
  encode: vi.fn((bytes: Uint8Array) => 'encodedBase64'),
  decodeAudioData: vi.fn(() =>
    Promise.resolve({
      duration: 0.001, // Very short duration
      numberOfChannels: 1,
      sampleRate: 24000,
      length: 24,
      getChannelData: vi.fn(() => new Float32Array(24)),
    })
  ),
}));

describe('CallScreen', () => {
  const mockOnEndCall = vi.fn();
  const mockConfig: PersonaConfig = {
    name: 'Test Persona',
    description: 'A test persona for testing',
    systemInstruction: 'You are a test assistant',
    greeting: 'Hello, this is a test',
    voice: 'Kore',
  };

  let mockGenerateGreetingAudio: ReturnType<typeof vi.fn>;
  let mockConnectToLiveSession: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGenerateGreetingAudio = vi.mocked(geminiService.generateGreetingAudio);
    mockConnectToLiveSession = vi.mocked(geminiService.connectToLiveSession);

    // Default mock implementations
    mockGenerateGreetingAudio.mockResolvedValue('base64GreetingAudio');
    mockConnectToLiveSession.mockReturnValue(
      Promise.resolve({
        close: vi.fn(),
        send: vi.fn(),
        sendRealtimeInput: vi.fn(),
      })
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial render', () => {
    it('should display the persona name', () => {
      render(<CallScreen onEndCall={mockOnEndCall} config={mockConfig} />);
      expect(screen.getByText('Test Persona')).toBeInTheDocument();
    });

    it('should display the persona description', () => {
      render(<CallScreen onEndCall={mockOnEndCall} config={mockConfig} />);
      expect(screen.getByText('A test persona for testing')).toBeInTheDocument();
    });

    it('should display a status indicator', () => {
      render(<CallScreen onEndCall={mockOnEndCall} config={mockConfig} />);
      expect(
        screen.getByText(/starting call|initializing|connecting/i)
      ).toBeInTheDocument();
    });

    it('should render the end call button', () => {
      const { container } = render(
        <CallScreen onEndCall={mockOnEndCall} config={mockConfig} />
      );
      const redButton = container.querySelector('.bg-red-600');
      expect(redButton).toBeInTheDocument();
    });

    it('should show "Active Call" when no description provided', () => {
      const configNoDesc: PersonaConfig = {
        ...mockConfig,
        description: undefined,
      };
      render(<CallScreen onEndCall={mockOnEndCall} config={configNoDesc} />);
      expect(screen.getByText('Active Call')).toBeInTheDocument();
    });
  });

  describe('call initialization', () => {
    it('should generate greeting audio on mount', async () => {
      render(<CallScreen onEndCall={mockOnEndCall} config={mockConfig} />);

      await waitFor(() => {
        expect(mockGenerateGreetingAudio).toHaveBeenCalledWith(
          mockConfig.greeting,
          mockConfig.voice
        );
      });
    });

    it('should call connectToLiveSession when greeting fails', async () => {
      // When greeting audio generation fails, the component should fallback to connecting directly
      mockGenerateGreetingAudio.mockRejectedValueOnce(new Error('TTS failed'));

      render(<CallScreen onEndCall={mockOnEndCall} config={mockConfig} />);

      await waitFor(
        () => {
          expect(mockConnectToLiveSession).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );
    });

    it('should pass correct parameters to connectToLiveSession on fallback', async () => {
      mockGenerateGreetingAudio.mockRejectedValueOnce(new Error('TTS failed'));

      render(<CallScreen onEndCall={mockOnEndCall} config={mockConfig} />);

      await waitFor(
        () => {
          expect(mockConnectToLiveSession).toHaveBeenCalledWith(
            expect.objectContaining({
              onOpen: expect.any(Function),
              onMessage: expect.any(Function),
              onError: expect.any(Function),
              onClose: expect.any(Function),
            }),
            mockConfig.systemInstruction,
            mockConfig.voice
          );
        },
        { timeout: 5000 }
      );
    });
  });

  describe('end call functionality', () => {
    it('should call onEndCall when end button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CallScreen onEndCall={mockOnEndCall} config={mockConfig} />
      );

      const endButton = container.querySelector('.bg-red-600');
      expect(endButton).toBeInTheDocument();

      await user.click(endButton!);

      expect(mockOnEndCall).toHaveBeenCalledTimes(1);
    });
  });

  describe('transcription display', () => {
    it('should render empty transcription initially', () => {
      const { container } = render(
        <CallScreen onEndCall={mockOnEndCall} config={mockConfig} />
      );

      const transcriptionArea = container.querySelector('.overflow-y-auto');
      expect(transcriptionArea).toBeInTheDocument();
    });

    it('should have proper styling for the transcription area', () => {
      const { container } = render(
        <CallScreen onEndCall={mockOnEndCall} config={mockConfig} />
      );

      const transcriptionArea = container.querySelector('.overflow-y-auto');
      expect(transcriptionArea).toHaveClass('flex-grow', 'p-6');
    });
  });

  describe('error handling', () => {
    it('should have layout structure for error display', () => {
      const { container } = render(
        <CallScreen onEndCall={mockOnEndCall} config={mockConfig} />
      );

      expect(container.querySelector('.flex-grow')).toBeInTheDocument();
    });
  });

  describe('UI structure', () => {
    it('should have a header section with persona info', () => {
      const { container } = render(
        <CallScreen onEndCall={mockOnEndCall} config={mockConfig} />
      );

      const header = container.querySelector('.border-b');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('bg-gray-800');
    });

    it('should have a footer section with end call button', () => {
      const { container } = render(
        <CallScreen onEndCall={mockOnEndCall} config={mockConfig} />
      );

      const footer = container.querySelector('.border-t');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('bg-gray-800');
    });

    it('should have dark theme styling', () => {
      const { container } = render(
        <CallScreen onEndCall={mockOnEndCall} config={mockConfig} />
      );

      expect(container.firstChild).toHaveClass('bg-gray-900');
    });

    it('should use full height layout', () => {
      const { container } = render(
        <CallScreen onEndCall={mockOnEndCall} config={mockConfig} />
      );

      expect(container.firstChild).toHaveClass('h-full', 'flex', 'flex-col');
    });
  });

  describe('status indicator integration', () => {
    it('should render StatusIndicator component', () => {
      render(<CallScreen onEndCall={mockOnEndCall} config={mockConfig} />);

      expect(
        screen.getByText(/starting call|initializing|connecting|listening/i)
      ).toBeInTheDocument();
    });
  });

  describe('config variations', () => {
    it('should work with different voices', () => {
      const configWithDifferentVoice: PersonaConfig = {
        ...mockConfig,
        voice: 'Fenrir',
      };

      render(
        <CallScreen onEndCall={mockOnEndCall} config={configWithDifferentVoice} />
      );

      expect(mockGenerateGreetingAudio).toHaveBeenCalledWith(
        expect.any(String),
        'Fenrir'
      );
    });

    it('should work with different greetings', () => {
      const configWithDifferentGreeting: PersonaConfig = {
        ...mockConfig,
        greeting: 'Welcome to the test',
      };

      render(
        <CallScreen onEndCall={mockOnEndCall} config={configWithDifferentGreeting} />
      );

      expect(mockGenerateGreetingAudio).toHaveBeenCalledWith(
        'Welcome to the test',
        expect.any(String)
      );
    });

    it('should display long persona names correctly', () => {
      const configWithLongName: PersonaConfig = {
        ...mockConfig,
        name: 'A Very Long Persona Name That Should Still Display Properly',
      };

      render(<CallScreen onEndCall={mockOnEndCall} config={configWithLongName} />);

      expect(
        screen.getByText(
          'A Very Long Persona Name That Should Still Display Properly'
        )
      ).toBeInTheDocument();
    });
  });

  describe('component lifecycle', () => {
    it('should attempt greeting generation on mount', () => {
      render(<CallScreen onEndCall={mockOnEndCall} config={mockConfig} />);

      expect(mockGenerateGreetingAudio).toHaveBeenCalledTimes(1);
    });

    it('should not throw errors on unmount', () => {
      const { unmount } = render(
        <CallScreen onEndCall={mockOnEndCall} config={mockConfig} />
      );

      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid mount/unmount cycles', () => {
      const { unmount: unmount1 } = render(
        <CallScreen onEndCall={mockOnEndCall} config={mockConfig} />
      );
      unmount1();

      const { unmount: unmount2 } = render(
        <CallScreen onEndCall={mockOnEndCall} config={mockConfig} />
      );
      unmount2();

      expect(mockGenerateGreetingAudio).toHaveBeenCalledTimes(2);
    });
  });
});
