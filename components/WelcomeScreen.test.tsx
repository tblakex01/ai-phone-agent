import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WelcomeScreen from './WelcomeScreen';
import { PERSONA_PRESETS, VOICE_NAMES, MAX_INPUT_LENGTHS } from '../constants';

describe('WelcomeScreen', () => {
  const mockOnStartCall = vi.fn();

  beforeEach(() => {
    mockOnStartCall.mockClear();
  });

  describe('initial render', () => {
    it('should render the title', () => {
      render(<WelcomeScreen onStartCall={mockOnStartCall} />);
      expect(screen.getByText('AI Phone Agent')).toBeInTheDocument();
    });

    it('should render the description', () => {
      render(<WelcomeScreen onStartCall={mockOnStartCall} />);
      expect(
        screen.getByText(/intelligent voice assistant/i)
      ).toBeInTheDocument();
    });

    it('should display the first preset persona by default', () => {
      render(<WelcomeScreen onStartCall={mockOnStartCall} />);
      expect(screen.getByText(PERSONA_PRESETS[0].name)).toBeInTheDocument();
    });

    it('should show the configure button', () => {
      render(<WelcomeScreen onStartCall={mockOnStartCall} />);
      expect(screen.getByText('Configure')).toBeInTheDocument();
    });

    it('should render the start call button', () => {
      render(<WelcomeScreen onStartCall={mockOnStartCall} />);
      expect(screen.getByText('Tap to start call')).toBeInTheDocument();
    });

    it('should show Current Persona label', () => {
      render(<WelcomeScreen onStartCall={mockOnStartCall} />);
      expect(screen.getByText('Current Persona')).toBeInTheDocument();
    });
  });

  describe('configuration panel', () => {
    it('should toggle configuration panel when clicking Configure', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen onStartCall={mockOnStartCall} />);

      // Config should be hidden initially
      expect(screen.queryByText('Preset Template')).not.toBeInTheDocument();

      // Click configure
      await user.click(screen.getByText('Configure'));

      // Config should now be visible
      expect(screen.getByText('Preset Template')).toBeInTheDocument();
      expect(screen.getByText('Hide')).toBeInTheDocument();
    });

    it('should hide configuration panel when clicking Hide', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen onStartCall={mockOnStartCall} />);

      // Open config
      await user.click(screen.getByText('Configure'));
      expect(screen.getByText('Hide')).toBeInTheDocument();

      // Close config
      await user.click(screen.getByText('Hide'));
      expect(screen.getByText('Configure')).toBeInTheDocument();
    });

    it('should display all preset options in dropdown', async () => {
      const user = userEvent.setup();
      const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

      await user.click(screen.getByText('Configure'));

      // Find the first select (Preset Template)
      const selects = container.querySelectorAll('select');
      const presetSelect = selects[0] as HTMLSelectElement;
      const options = Array.from(presetSelect.options).map((o) => o.text);

      PERSONA_PRESETS.forEach((preset) => {
        expect(options).toContain(preset.name);
      });

      // Should also have Custom option
      expect(options).toContain('Custom');
    });

    it('should display all voice options', async () => {
      const user = userEvent.setup();
      const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

      await user.click(screen.getByText('Configure'));

      // Find the second select (Voice)
      const selects = container.querySelectorAll('select');
      const voiceSelect = selects[1] as HTMLSelectElement;
      const options = Array.from(voiceSelect.options).map((o) => o.text);

      VOICE_NAMES.forEach((voice) => {
        expect(options).toContain(voice);
      });
    });

    it('should show name, system instructions, and greeting fields', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen onStartCall={mockOnStartCall} />);

      await user.click(screen.getByText('Configure'));

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('System Instructions')).toBeInTheDocument();
      expect(screen.getByText('Greeting Message')).toBeInTheDocument();
    });

    it('should enforce max length on inputs', async () => {
      const user = userEvent.setup();
      const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

      await user.click(screen.getByText('Configure'));

      const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      const instructionsTextarea = screen.getByPlaceholderText(/describe how the agent should behave/i) as HTMLTextAreaElement;
      const greetingTextarea = screen.getByPlaceholderText(/what the agent says first/i) as HTMLTextAreaElement;

      expect(nameInput.maxLength).toBe(MAX_INPUT_LENGTHS.NAME);
      expect(instructionsTextarea.maxLength).toBe(MAX_INPUT_LENGTHS.SYSTEM_INSTRUCTION);
      expect(greetingTextarea.maxLength).toBe(MAX_INPUT_LENGTHS.GREETING);
    });
  });

  describe('preset selection', () => {
    it('should update configuration when selecting a different preset', async () => {
      const user = userEvent.setup();
      const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

      await user.click(screen.getByText('Configure'));

      const selects = container.querySelectorAll('select');
      const presetSelect = selects[0];
      await user.selectOptions(presetSelect, PERSONA_PRESETS[1].id);

      // Check that the name field updated
      const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      expect(nameInput.value).toBe(PERSONA_PRESETS[1].name);
    });

    it('should update displayed persona name when preset changes', async () => {
      const user = userEvent.setup();
      const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

      await user.click(screen.getByText('Configure'));

      const selects = container.querySelectorAll('select');
      await user.selectOptions(selects[0], PERSONA_PRESETS[2].id);

      // Close config to see the displayed name
      await user.click(screen.getByText('Hide'));

      expect(screen.getByText(PERSONA_PRESETS[2].name)).toBeInTheDocument();
    });

    it('should update voice when preset changes', async () => {
      const user = userEvent.setup();
      const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

      await user.click(screen.getByText('Configure'));

      const selects = container.querySelectorAll('select');
      await user.selectOptions(selects[0], PERSONA_PRESETS[1].id);

      const voiceSelect = selects[1] as HTMLSelectElement;
      expect(voiceSelect.value).toBe(PERSONA_PRESETS[1].voice);
    });
  });

  describe('custom configuration', () => {
    it('should switch to custom when name is modified', async () => {
      const user = userEvent.setup();
      const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

      await user.click(screen.getByText('Configure'));

      const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, 'My Custom Persona');

      const presetSelect = container.querySelectorAll('select')[0] as HTMLSelectElement;
      expect(presetSelect.value).toBe('custom');
    });

    it('should switch to custom when system instructions are modified', async () => {
      const user = userEvent.setup();
      const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

      await user.click(screen.getByText('Configure'));

      const instructionsTextarea = screen.getByPlaceholderText(/describe how the agent should behave/i);
      await user.clear(instructionsTextarea);
      await user.type(instructionsTextarea, 'Custom instructions');

      const presetSelect = container.querySelectorAll('select')[0] as HTMLSelectElement;
      expect(presetSelect.value).toBe('custom');
    });

    it('should switch to custom when greeting is modified', async () => {
      const user = userEvent.setup();
      const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

      await user.click(screen.getByText('Configure'));

      const greetingTextarea = screen.getByPlaceholderText(/what the agent says first/i);
      await user.clear(greetingTextarea);
      await user.type(greetingTextarea, 'Custom greeting');

      const presetSelect = container.querySelectorAll('select')[0] as HTMLSelectElement;
      expect(presetSelect.value).toBe('custom');
    });

    it('should switch to custom when voice is modified', async () => {
      const user = userEvent.setup();
      const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

      await user.click(screen.getByText('Configure'));

      const selects = container.querySelectorAll('select');
      const voiceSelect = selects[1];

      // Select a different voice than the default preset
      const differentVoice = VOICE_NAMES.find((v) => v !== PERSONA_PRESETS[0].voice);
      if (differentVoice) {
        await user.selectOptions(voiceSelect, differentVoice);
      }

      const presetSelect = selects[0] as HTMLSelectElement;
      expect(presetSelect.value).toBe('custom');
    });
  });

  describe('start call functionality', () => {
    it('should call onStartCall with default config when button clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

      // Find the green start button
      const startButton = container.querySelector('.bg-green-500') as HTMLButtonElement;
      await user.click(startButton);

      expect(mockOnStartCall).toHaveBeenCalledTimes(1);
      expect(mockOnStartCall).toHaveBeenCalledWith(
        expect.objectContaining({
          name: PERSONA_PRESETS[0].name,
          voice: PERSONA_PRESETS[0].voice,
          greeting: PERSONA_PRESETS[0].greeting,
          systemInstruction: PERSONA_PRESETS[0].systemInstruction,
        })
      );
    });

    it('should call onStartCall with selected preset config', async () => {
      const user = userEvent.setup();
      const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

      await user.click(screen.getByText('Configure'));

      const selects = container.querySelectorAll('select');
      await user.selectOptions(selects[0], PERSONA_PRESETS[2].id);

      await user.click(screen.getByText('Hide'));

      const startButton = container.querySelector('.bg-green-500') as HTMLButtonElement;
      await user.click(startButton);

      expect(mockOnStartCall).toHaveBeenCalledWith(
        expect.objectContaining({
          name: PERSONA_PRESETS[2].name,
          voice: PERSONA_PRESETS[2].voice,
        })
      );
    });

    it('should call onStartCall with custom config after modifications', async () => {
      const user = userEvent.setup();
      const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

      await user.click(screen.getByText('Configure'));

      const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, 'Custom Bot');

      const startButton = container.querySelector('.bg-green-500') as HTMLButtonElement;
      await user.click(startButton);

      expect(mockOnStartCall).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Custom Bot',
        })
      );
    });
  });

  describe('UI styling and structure', () => {
    it('should have dark theme styling', () => {
      const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);
      expect(container.firstChild).toHaveClass('bg-gray-800', 'text-white');
    });

    it('should have a green start call button', () => {
      const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);
      const greenButton = container.querySelector('.bg-green-500');
      expect(greenButton).toBeInTheDocument();
    });

    it('should display persona description when config is closed', () => {
      render(<WelcomeScreen onStartCall={mockOnStartCall} />);
      if (PERSONA_PRESETS[0].description) {
        expect(screen.getByText(PERSONA_PRESETS[0].description)).toBeInTheDocument();
      }
    });
  });

  describe('accessibility', () => {
    it('should have form controls', async () => {
      const user = userEvent.setup();
      const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

      await user.click(screen.getByText('Configure'));

      // Check for form controls
      const selects = container.querySelectorAll('select');
      const inputs = container.querySelectorAll('input[type="text"]');
      const textareas = container.querySelectorAll('textarea');

      expect(selects.length).toBeGreaterThanOrEqual(2);
      expect(inputs.length).toBeGreaterThanOrEqual(1);
      expect(textareas.length).toBeGreaterThanOrEqual(2);
    });

    it('should have accessible buttons', () => {
      render(<WelcomeScreen onStartCall={mockOnStartCall} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('input validation and edge cases', () => {
    describe('empty string inputs', () => {
      it('should allow empty name field', async () => {
        const user = userEvent.setup();
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
        await user.clear(nameInput);

        // Should allow empty name
        expect(nameInput.value).toBe('');

        // Should still call onStartCall with empty name
        const startButton = container.querySelector('.bg-green-500') as HTMLButtonElement;
        await user.click(startButton);

        expect(mockOnStartCall).toHaveBeenCalledWith(
          expect.objectContaining({
            name: ''
          })
        );
      });

      it('should allow empty system instructions', async () => {
        const user = userEvent.setup();
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        const instructionsTextarea = screen.getByPlaceholderText(/describe how the agent should behave/i);
        await user.clear(instructionsTextarea);

        expect((instructionsTextarea as HTMLTextAreaElement).value).toBe('');

        const startButton = container.querySelector('.bg-green-500') as HTMLButtonElement;
        await user.click(startButton);

        expect(mockOnStartCall).toHaveBeenCalledWith(
          expect.objectContaining({
            systemInstruction: ''
          })
        );
      });

      it('should allow empty greeting message', async () => {
        const user = userEvent.setup();
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        const greetingTextarea = screen.getByPlaceholderText(/what the agent says first/i);
        await user.clear(greetingTextarea);

        expect((greetingTextarea as HTMLTextAreaElement).value).toBe('');

        const startButton = container.querySelector('.bg-green-500') as HTMLButtonElement;
        await user.click(startButton);

        expect(mockOnStartCall).toHaveBeenCalledWith(
          expect.objectContaining({
            greeting: ''
          })
        );
      });
    });

    describe('very long input text', () => {
      it('should handle very long name input', async () => {
        const user = userEvent.setup();
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
        const longName = 'A'.repeat(500);
        await user.clear(nameInput);
        await user.paste(longName);

        expect(nameInput.value).toBe(longName);

        const startButton = container.querySelector('.bg-green-500') as HTMLButtonElement;
        await user.click(startButton);

        expect(mockOnStartCall).toHaveBeenCalledWith(
          expect.objectContaining({
            name: longName
          })
        );
      });

      it('should handle very long system instructions', async () => {
        const user = userEvent.setup();
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        const instructionsTextarea = screen.getByPlaceholderText(/describe how the agent should behave/i);
        const longInstructions = 'Instructions '.repeat(100);
        await user.clear(instructionsTextarea);
        await user.paste(longInstructions);

        expect((instructionsTextarea as HTMLTextAreaElement).value).toBe(longInstructions);
      });

      it('should handle very long greeting message', async () => {
        const user = userEvent.setup();
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        const greetingTextarea = screen.getByPlaceholderText(/what the agent says first/i);
        const longGreeting = 'Hello '.repeat(200);
        await user.clear(greetingTextarea);
        await user.paste(longGreeting);

        expect((greetingTextarea as HTMLTextAreaElement).value).toBe(longGreeting);
      });
    });

    describe('special characters in inputs', () => {
      it('should handle special characters in name', async () => {
        const user = userEvent.setup();
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
        const specialName = '<script>alert("xss")</script>';
        await user.clear(nameInput);
        await user.type(nameInput, specialName);

        expect(nameInput.value).toBe(specialName);

        const startButton = container.querySelector('.bg-green-500') as HTMLButtonElement;
        await user.click(startButton);

        expect(mockOnStartCall).toHaveBeenCalledWith(
          expect.objectContaining({
            name: specialName
          })
        );
      });

      it('should handle unicode characters in inputs', async () => {
        const user = userEvent.setup();
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
        const unicodeName = '日本語アシスタント 🤖';
        await user.clear(nameInput);
        await user.type(nameInput, unicodeName);

        expect(nameInput.value).toBe(unicodeName);
      });

      it('should handle newlines in textarea inputs', async () => {
        const user = userEvent.setup();
        render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        const instructionsTextarea = screen.getByPlaceholderText(/describe how the agent should behave/i) as HTMLTextAreaElement;
        await user.clear(instructionsTextarea);
        await user.type(instructionsTextarea, 'Line 1{enter}Line 2{enter}Line 3');

        expect(instructionsTextarea.value).toContain('Line 1');
        expect(instructionsTextarea.value).toContain('Line 2');
      });

      it('should handle HTML entities in inputs', async () => {
        const user = userEvent.setup();
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
        const htmlEntities = '&amp; &lt; &gt; &quot;';
        await user.clear(nameInput);
        await user.type(nameInput, htmlEntities);

        expect(nameInput.value).toBe(htmlEntities);
      });

      it('should handle quotes in inputs', async () => {
        const user = userEvent.setup();
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        const greetingTextarea = screen.getByPlaceholderText(/what the agent says first/i) as HTMLTextAreaElement;
        await user.clear(greetingTextarea);
        await user.type(greetingTextarea, 'Hello! I\'m your "helpful" assistant.');

        expect(greetingTextarea.value).toContain("I'm");
        expect(greetingTextarea.value).toContain('"helpful"');
      });
    });

    describe('whitespace-only inputs', () => {
      it('should handle whitespace-only name', async () => {
        const user = userEvent.setup();
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
        await user.clear(nameInput);
        await user.type(nameInput, '   ');

        expect(nameInput.value).toBe('   ');

        const startButton = container.querySelector('.bg-green-500') as HTMLButtonElement;
        await user.click(startButton);

        expect(mockOnStartCall).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '   '
          })
        );
      });

      it('should handle tabs and mixed whitespace', async () => {
        const user = userEvent.setup();
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
        await user.clear(nameInput);
        // Tab characters might be converted, but spaces should work
        await user.type(nameInput, '  test  ');

        expect(nameInput.value).toBe('  test  ');
      });
    });

    describe('rapid input changes', () => {
      it('should handle rapid typing in name field', async () => {
        const user = userEvent.setup({ delay: null }); // No delay for rapid input
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
        await user.clear(nameInput);
        await user.type(nameInput, 'RapidTypingTest');

        expect(nameInput.value).toBe('RapidTypingTest');
      });

      it('should handle rapid preset switching', async () => {
        const user = userEvent.setup({ delay: null });
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        const selects = container.querySelectorAll('select');
        const presetSelect = selects[0];

        // Rapidly switch between presets
        for (let i = 0; i < PERSONA_PRESETS.length; i++) {
          await user.selectOptions(presetSelect, PERSONA_PRESETS[i].id);
        }

        // Final state should be last preset
        expect((presetSelect as HTMLSelectElement).value).toBe(
          PERSONA_PRESETS[PERSONA_PRESETS.length - 1].id
        );
      });

      it('should handle clearing and re-typing quickly', async () => {
        const user = userEvent.setup({ delay: null });
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;

        // Clear and type multiple times
        for (let i = 0; i < 3; i++) {
          await user.clear(nameInput);
          await user.type(nameInput, `Name${i}`);
        }

        expect(nameInput.value).toBe('Name2');
      });
    });

    describe('input boundaries', () => {
      it('should handle single character input', async () => {
        const user = userEvent.setup();
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
        await user.clear(nameInput);
        await user.type(nameInput, 'A');

        expect(nameInput.value).toBe('A');

        const startButton = container.querySelector('.bg-green-500') as HTMLButtonElement;
        await user.click(startButton);

        expect(mockOnStartCall).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'A'
          })
        );
      });

      it('should preserve input when toggling config panel', async () => {
        const user = userEvent.setup();
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
        await user.clear(nameInput);
        await user.type(nameInput, 'Preserved Name');

        // Close config
        await user.click(screen.getByText('Hide'));

        // Re-open config
        await user.click(screen.getByText('Configure'));

        const nameInputAfter = container.querySelector('input[type="text"]') as HTMLInputElement;
        expect(nameInputAfter.value).toBe('Preserved Name');
      });
    });

    describe('concurrent field modifications', () => {
      it('should handle modifying multiple fields rapidly', async () => {
        const user = userEvent.setup({ delay: null });
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
        const instructionsTextarea = screen.getByPlaceholderText(/describe how the agent should behave/i);
        const greetingTextarea = screen.getByPlaceholderText(/what the agent says first/i);

        await user.clear(nameInput);
        await user.type(nameInput, 'Custom Name');

        await user.clear(instructionsTextarea);
        await user.type(instructionsTextarea, 'Custom Instructions');

        await user.clear(greetingTextarea);
        await user.type(greetingTextarea, 'Custom Greeting');

        const startButton = container.querySelector('.bg-green-500') as HTMLButtonElement;
        await user.click(startButton);

        expect(mockOnStartCall).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Custom Name',
            systemInstruction: 'Custom Instructions',
            greeting: 'Custom Greeting'
          })
        );
      });

      it('should switch to custom when any field is modified', async () => {
        const user = userEvent.setup();
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        // First select a preset
        const selects = container.querySelectorAll('select');
        const presetSelect = selects[0] as HTMLSelectElement;
        await user.selectOptions(presetSelect, PERSONA_PRESETS[1].id);

        expect(presetSelect.value).toBe(PERSONA_PRESETS[1].id);

        // Then modify the name
        const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
        await user.type(nameInput, ' Modified');

        // Should switch to custom
        expect(presetSelect.value).toBe('custom');
      });
    });
  });
});
