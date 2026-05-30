import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuidelinesIntro } from './GuidelinesIntro';

describe('GuidelinesIntro', () => {
  it('renders personal guidelines and fires onContinue', () => {
    const onContinue = vi.fn();
    render(<GuidelinesIntro variant="personal" onContinue={onContinue} />);
    expect(screen.getByText('Community Guidelines')).toBeInTheDocument();
    expect(screen.getByText('Platonic Connections')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('renders business guidelines and fires onContinue', () => {
    const onContinue = vi.fn();
    render(<GuidelinesIntro variant="business" onContinue={onContinue} />);
    expect(screen.getByText('Business Guidelines')).toBeInTheDocument();
    expect(screen.getByText('Honest Listings')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
