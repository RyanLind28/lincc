import { describe, it, expect } from 'vitest';
import { overallStatus, type HealthCheck } from './statusService';

const make = (status: HealthCheck['status']): HealthCheck => ({
  id: 'x',
  name: 'X',
  description: '',
  status,
  latencyMs: null,
});

describe('overallStatus', () => {
  it('returns ok when all checks are ok', () => {
    expect(overallStatus([make('ok'), make('ok'), make('ok')])).toBe('ok');
  });

  it('returns degraded when any check is degraded but none are down', () => {
    expect(overallStatus([make('ok'), make('degraded'), make('ok')])).toBe('degraded');
  });

  it('returns down when any check is down (even if others are ok)', () => {
    expect(overallStatus([make('ok'), make('down'), make('degraded')])).toBe('down');
  });

  it('treats unknown as inconclusive — does not promote to degraded on its own', () => {
    expect(overallStatus([make('ok'), make('unknown')])).toBe('ok');
  });

  it('returns unknown when every check is unknown', () => {
    expect(overallStatus([make('unknown'), make('unknown')])).toBe('unknown');
  });
});
