import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { PERSONA_PRESETS } from './constants';

// Mock the child components to isolate App testing
vi.mock('./components/WelcomeScreen', () => ({
  default: ({ onStartCall }: { onStartCall: (config: any) => void }) => (
    <div data-testid="welcome-screen">
      <button
        data-testid="start-call-btn"
        onClick={() =>
          onStartCall({
            name: 'Test Persona',
            description: 'Test Description',
            systemInstruction: 'Test instructions',
            greeting: 'Hello test',
            voice: 'Kore',
          })
        }
      >
        Start Call
      </button>
    </div>
  ),
}));

vi.mock('./components/CallScreen', () => ({
  default: ({
    onEndCall,
    config,
  }: {
    onEndCall: () => void;
    config: any;
  }) => (
    <div data-testid="call-screen">
      <span data-testid="persona-name">{config.name}</span>
      <button data-testid="end-call-btn" onClick={onEndCall}>
        End Call
      </button>
    </div>
  ),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial render', () => {
    it('should render the WelcomeScreen by default', () => {
      render(<App />);
      expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();
    });

    it('should not render CallScreen initially', () => {
      render(<App />);
      expect(screen.queryByTestId('call-screen')).not.toBeInTheDocument();
    });

    it('should have proper container styling', () => {
      const { container } = render(<App />);
      expect(container.firstChild).toHaveClass(
        'min-h-screen',
        'bg-gray-900',
        'text-white'
      );
    });

    it('should have a phone-like container', () => {
      const { container } = render(<App />);
      const phoneContainer = container.querySelector('.max-w-md');
      expect(phoneContainer).toBeInTheDocument();
      expect(phoneContainer).toHaveClass('rounded-3xl', 'shadow-2xl');
    });
  });

  describe('navigation between views', () => {
    it('should switch to CallScreen when call is started', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Initially on welcome screen
      expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();

      // Click start call
      await user.click(screen.getByTestId('start-call-btn'));

      // Should now show call screen
      expect(screen.getByTestId('call-screen')).toBeInTheDocument();
      expect(screen.queryByTestId('welcome-screen')).not.toBeInTheDocument();
    });

    it('should switch back to WelcomeScreen when call ends', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start a call
      await user.click(screen.getByTestId('start-call-btn'));
      expect(screen.getByTestId('call-screen')).toBeInTheDocument();

      // End the call
      await user.click(screen.getByTestId('end-call-btn'));

      // Should be back on welcome screen
      expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();
      expect(screen.queryByTestId('call-screen')).not.toBeInTheDocument();
    });

    it('should allow multiple call cycles', async () => {
      const user = userEvent.setup();
      render(<App />);

      // First call cycle
      await user.click(screen.getByTestId('start-call-btn'));
      expect(screen.getByTestId('call-screen')).toBeInTheDocument();
      await user.click(screen.getByTestId('end-call-btn'));
      expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();

      // Second call cycle
      await user.click(screen.getByTestId('start-call-btn'));
      expect(screen.getByTestId('call-screen')).toBeInTheDocument();
      await user.click(screen.getByTestId('end-call-btn'));
      expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();
    });
  });

  describe('persona config passing', () => {
    it('should pass persona config to CallScreen', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByTestId('start-call-btn'));

      expect(screen.getByTestId('persona-name')).toHaveTextContent('Test Persona');
    });
  });

  describe('layout and styling', () => {
    it('should center content on the page', () => {
      const { container } = render(<App />);
      expect(container.firstChild).toHaveClass(
        'flex',
        'items-center',
        'justify-center'
      );
    });

    it('should have padding for mobile', () => {
      const { container } = render(<App />);
      expect(container.firstChild).toHaveClass('p-4');
    });

    it('should have max height constraint for phone container', () => {
      const { container } = render(<App />);
      const phoneContainer = container.querySelector('.max-w-md');
      expect(phoneContainer?.className).toContain('max-h-[800px]');
    });

    it('should have border styling for phone container', () => {
      const { container } = render(<App />);
      const phoneContainer = container.querySelector('.max-w-md');
      expect(phoneContainer).toHaveClass('border-4', 'border-gray-700');
    });
  });
});

describe('App Integration', () => {
  // These tests use the real components (not mocked)
  beforeEach(() => {
    vi.resetModules();
  });

  it('should render with default persona from presets', async () => {
    // Unmock for integration test
    vi.doUnmock('./components/WelcomeScreen');
    vi.doUnmock('./components/CallScreen');

    // Re-import fresh
    const { default: RealApp } = await import('./App');

    render(<RealApp />);

    // Should show the first preset persona name
    expect(screen.getByText(PERSONA_PRESETS[0].name)).toBeInTheDocument();
  });
});
