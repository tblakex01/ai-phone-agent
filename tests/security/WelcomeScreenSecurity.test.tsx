
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import WelcomeScreen from '../../components/WelcomeScreen';

describe('WelcomeScreen Security', () => {
  it('should restrict input length for name field to prevent DoS', async () => {
    const onStartCall = vi.fn();
    render(<WelcomeScreen onStartCall={onStartCall} />);

    // Toggle config
    const configButton = screen.getByText(/Configure/i);
    await userEvent.click(configButton);

    // Assuming the first one is the select option, or there are multiple.
    // Let's find the input specifically.
    const nameInput = screen.getAllByDisplayValue(/Personal Assistant/i).find(el => el.tagName === 'INPUT');
    if (!nameInput) throw new Error('Name input not found');

    // Create a long string
    const longString = 'a'.repeat(200);

    // Try to type a very long name
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, longString);

    // We expect it to be truncated to 50 chars
    expect(nameInput).toHaveValue(longString.substring(0, 50));
  });

  it('should restrict input length for system instruction to prevent massive prompts', async () => {
    const onStartCall = vi.fn();
    render(<WelcomeScreen onStartCall={onStartCall} />);

    // Toggle config
    const configButton = screen.getByText(/Configure/i);
    await userEvent.click(configButton);

    const instructionInput = screen.getByPlaceholderText(/Describe how the agent should behave/i);

    // Create a long string
    const longString = 'a'.repeat(10001); // Assuming we want to limit to 1000 or so

    await userEvent.clear(instructionInput);
    // Paste/Type long string
    await userEvent.paste(longString);

    // We expect it to be truncated to 2000 chars
    expect(instructionInput).toHaveValue(longString.substring(0, 2000));
  });
});
