import { describe, it, expect } from 'vitest';
import { cn, calculateAge, formatRelativeTime } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('handles undefined', () => {
    expect(cn('base', undefined)).toBe('base');
  });
});

describe('calculateAge', () => {
  it('calculates correct age', () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 25;
    const dob = `${birthYear}-01-01`;
    const age = calculateAge(dob);
    expect(age).toBeGreaterThanOrEqual(24);
    expect(age).toBeLessThanOrEqual(25);
  });

  it('handles birthday not yet this year', () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 30;
    const dob = `${birthYear}-12-31`;
    const age = calculateAge(dob);
    expect(age).toBeGreaterThanOrEqual(29);
    expect(age).toBeLessThanOrEqual(30);
  });
});

describe('formatRelativeTime', () => {
  it('shows "just now" for recent times', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toMatch(/just now|0m|in 0m/i);
  });

  it('accepts Date objects', () => {
    const result = formatRelativeTime(new Date());
    expect(typeof result).toBe('string');
  });
});
