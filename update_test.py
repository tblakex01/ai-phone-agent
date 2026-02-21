import re

file_path = 'components/WelcomeScreen.test.tsx'

with open(file_path, 'r') as f:
    content = f.read()

target_block = """      it('should show character count indicators', async () => {
        const user = userEvent.setup();
        render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        // Initial state (default persona)
        expect(screen.getByText(`${PERSONA_PRESETS[0].name.length}/${MAX_INPUT_LENGTHS.name}`)).toBeInTheDocument();
        expect(screen.getByText(`${PERSONA_PRESETS[0].systemInstruction.length}/${MAX_INPUT_LENGTHS.systemInstruction}`)).toBeInTheDocument();
        expect(screen.getByText(`${PERSONA_PRESETS[0].greeting.length}/${MAX_INPUT_LENGTHS.greeting}`)).toBeInTheDocument();
      });"""

new_test = """      it('should show character count indicators', async () => {
        const user = userEvent.setup();
        const { container } = render(<WelcomeScreen onStartCall={mockOnStartCall} />);

        await user.click(screen.getByText('Configure'));

        // Check name input
        const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
        const initialNameLength = nameInput.value.length;
        expect(screen.getByText(`${initialNameLength}/${MAX_INPUT_LENGTHS.name}`)).toBeInTheDocument();

        // Check system instruction
        const instructionsTextarea = screen.getByPlaceholderText(/describe how the agent should behave/i) as HTMLTextAreaElement;
        const initialSystemInstructionLength = instructionsTextarea.value.length;
        expect(screen.getByText(`${initialSystemInstructionLength}/${MAX_INPUT_LENGTHS.systemInstruction}`)).toBeInTheDocument();

        // Check greeting
        const greetingTextarea = screen.getByPlaceholderText(/what the agent says first/i) as HTMLTextAreaElement;
        const initialGreetingLength = greetingTextarea.value.length;
        expect(screen.getByText(`${initialGreetingLength}/${MAX_INPUT_LENGTHS.greeting}`)).toBeInTheDocument();
      });"""

if target_block in content:
    new_content = content.replace(target_block, new_test)
    with open(file_path, 'w') as f:
        f.write(new_content)
    print("Test updated successfully.")
else:
    print("Could not find the test block to replace.")
