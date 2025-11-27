import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PhoneIcon, PhoneHangupIcon, MicIcon, SettingsIcon } from './Icons';

describe('Icons', () => {
  describe('PhoneIcon', () => {
    it('should render an SVG element', () => {
      const { container } = render(<PhoneIcon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should accept and apply className prop', () => {
      const { container } = render(<PhoneIcon className="w-10 h-10 text-white" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-10', 'h-10', 'text-white');
    });

    it('should have proper SVG attributes', () => {
      const { container } = render(<PhoneIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
    });

    it('should contain a path element', () => {
      const { container } = render(<PhoneIcon />);
      expect(container.querySelector('path')).toBeInTheDocument();
    });
  });

  describe('PhoneHangupIcon', () => {
    it('should render an SVG element', () => {
      const { container } = render(<PhoneHangupIcon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should accept and apply className prop', () => {
      const { container } = render(<PhoneHangupIcon className="w-8 h-8" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-8', 'h-8');
    });

    it('should have multiple path elements', () => {
      const { container } = render(<PhoneHangupIcon />);
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(1);
    });

    it('should have proper SVG attributes', () => {
      const { container } = render(<PhoneHangupIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('stroke-width', '1.5');
    });
  });

  describe('MicIcon', () => {
    it('should render an SVG element', () => {
      const { container } = render(<MicIcon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should accept and apply className prop', () => {
      const { container } = render(<MicIcon className="w-5 h-5 animate-pulse" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-5', 'h-5', 'animate-pulse');
    });

    it('should have proper SVG attributes', () => {
      const { container } = render(<MicIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });
  });

  describe('SettingsIcon', () => {
    it('should render an SVG element', () => {
      const { container } = render(<SettingsIcon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should accept and apply className prop', () => {
      const { container } = render(<SettingsIcon className="w-4 h-4 text-blue-400" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-4', 'h-4', 'text-blue-400');
    });

    it('should have two path elements (gear and inner circle)', () => {
      const { container } = render(<SettingsIcon />);
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBe(2);
    });

    it('should have proper SVG attributes', () => {
      const { container } = render(<SettingsIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('stroke-width', '1.5');
    });
  });

  describe('Icon consistency', () => {
    it('all icons should use currentColor for stroke', () => {
      const icons = [
        <PhoneIcon key="phone" />,
        <PhoneHangupIcon key="hangup" />,
        <MicIcon key="mic" />,
        <SettingsIcon key="settings" />,
      ];

      icons.forEach((icon) => {
        const { container, unmount } = render(icon);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('stroke', 'currentColor');
        unmount();
      });
    });

    it('all icons should have consistent viewBox', () => {
      const icons = [
        <PhoneIcon key="phone" />,
        <PhoneHangupIcon key="hangup" />,
        <MicIcon key="mic" />,
        <SettingsIcon key="settings" />,
      ];

      icons.forEach((icon) => {
        const { container, unmount } = render(icon);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
        unmount();
      });
    });

    it('all icons should render without className prop', () => {
      const { container: c1 } = render(<PhoneIcon />);
      const { container: c2 } = render(<PhoneHangupIcon />);
      const { container: c3 } = render(<MicIcon />);
      const { container: c4 } = render(<SettingsIcon />);

      expect(c1.querySelector('svg')).toBeInTheDocument();
      expect(c2.querySelector('svg')).toBeInTheDocument();
      expect(c3.querySelector('svg')).toBeInTheDocument();
      expect(c4.querySelector('svg')).toBeInTheDocument();
    });
  });
});
