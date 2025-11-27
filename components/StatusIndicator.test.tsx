import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusIndicator from './StatusIndicator';
import { CallStatus } from '../types';

describe('StatusIndicator', () => {
  describe('IDLE status', () => {
    it('should display "Initializing" text', () => {
      render(<StatusIndicator status={CallStatus.IDLE} />);
      expect(screen.getByText('Initializing')).toBeInTheDocument();
    });

    it('should not show pulse animation', () => {
      const { container } = render(<StatusIndicator status={CallStatus.IDLE} />);
      expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
    });

    it('should have gray color styling', () => {
      const { container } = render(<StatusIndicator status={CallStatus.IDLE} />);
      expect(container.firstChild).toHaveClass('text-gray-400');
    });
  });

  describe('GREETING status', () => {
    it('should display "Starting Call..." text', () => {
      render(<StatusIndicator status={CallStatus.GREETING} />);
      expect(screen.getByText('Starting Call...')).toBeInTheDocument();
    });

    it('should have yellow color styling', () => {
      const { container } = render(<StatusIndicator status={CallStatus.GREETING} />);
      expect(container.firstChild).toHaveClass('text-yellow-400');
    });

    it('should not show pulse animation', () => {
      const { container } = render(<StatusIndicator status={CallStatus.GREETING} />);
      expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
    });
  });

  describe('CONNECTING status', () => {
    it('should display "Connecting..." text', () => {
      render(<StatusIndicator status={CallStatus.CONNECTING} />);
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('should show pulse animation', () => {
      const { container } = render(<StatusIndicator status={CallStatus.CONNECTING} />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should have yellow color styling', () => {
      const { container } = render(<StatusIndicator status={CallStatus.CONNECTING} />);
      expect(container.firstChild).toHaveClass('text-yellow-400');
    });
  });

  describe('LISTENING status', () => {
    it('should display "Listening..." text', () => {
      render(<StatusIndicator status={CallStatus.LISTENING} />);
      expect(screen.getByText('Listening...')).toBeInTheDocument();
    });

    it('should show pulse animation with mic icon', () => {
      const { container } = render(<StatusIndicator status={CallStatus.LISTENING} />);
      const pulsing = container.querySelector('.animate-pulse');
      expect(pulsing).toBeInTheDocument();
      expect(pulsing?.tagName.toLowerCase()).toBe('svg');
    });

    it('should have green color styling', () => {
      const { container } = render(<StatusIndicator status={CallStatus.LISTENING} />);
      expect(container.firstChild).toHaveClass('text-green-400');
    });
  });

  describe('AGENT_SPEAKING status', () => {
    it('should display "Agent Speaking" text', () => {
      render(<StatusIndicator status={CallStatus.AGENT_SPEAKING} />);
      expect(screen.getByText('Agent Speaking')).toBeInTheDocument();
    });

    it('should not show pulse animation', () => {
      const { container } = render(<StatusIndicator status={CallStatus.AGENT_SPEAKING} />);
      expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
    });

    it('should have blue color styling', () => {
      const { container } = render(<StatusIndicator status={CallStatus.AGENT_SPEAKING} />);
      expect(container.firstChild).toHaveClass('text-blue-400');
    });
  });

  describe('THINKING status', () => {
    it('should display "Thinking..." text', () => {
      render(<StatusIndicator status={CallStatus.THINKING} />);
      expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });

    it('should show pulse animation', () => {
      const { container } = render(<StatusIndicator status={CallStatus.THINKING} />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should have purple color styling', () => {
      const { container } = render(<StatusIndicator status={CallStatus.THINKING} />);
      expect(container.firstChild).toHaveClass('text-purple-400');
    });
  });

  describe('ERROR status', () => {
    it('should display "Connection Error" text', () => {
      render(<StatusIndicator status={CallStatus.ERROR} />);
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
    });

    it('should not show pulse animation', () => {
      const { container } = render(<StatusIndicator status={CallStatus.ERROR} />);
      expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
    });

    it('should have red color styling', () => {
      const { container } = render(<StatusIndicator status={CallStatus.ERROR} />);
      expect(container.firstChild).toHaveClass('text-red-400');
    });
  });

  describe('ENDED status', () => {
    it('should display "Call Ended" text', () => {
      render(<StatusIndicator status={CallStatus.ENDED} />);
      expect(screen.getByText('Call Ended')).toBeInTheDocument();
    });

    it('should not show pulse animation', () => {
      const { container } = render(<StatusIndicator status={CallStatus.ENDED} />);
      expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
    });

    it('should have gray color styling', () => {
      const { container } = render(<StatusIndicator status={CallStatus.ENDED} />);
      expect(container.firstChild).toHaveClass('text-gray-500');
    });
  });

  describe('component structure', () => {
    it('should render with proper flex layout', () => {
      const { container } = render(<StatusIndicator status={CallStatus.IDLE} />);
      expect(container.firstChild).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should render status text with proper styling', () => {
      render(<StatusIndicator status={CallStatus.IDLE} />);
      const text = screen.getByText('Initializing');
      expect(text.tagName.toLowerCase()).toBe('span');
      expect(text).toHaveClass('text-sm', 'font-medium');
    });
  });

  describe('all statuses covered', () => {
    it('should handle all CallStatus enum values', () => {
      const allStatuses = [
        CallStatus.IDLE,
        CallStatus.GREETING,
        CallStatus.CONNECTING,
        CallStatus.LISTENING,
        CallStatus.AGENT_SPEAKING,
        CallStatus.THINKING,
        CallStatus.ERROR,
        CallStatus.ENDED,
      ];

      allStatuses.forEach((status) => {
        const { container, unmount } = render(<StatusIndicator status={status} />);
        // Should not throw and should render something
        expect(container.firstChild).toBeInTheDocument();
        unmount();
      });
    });
  });
});
