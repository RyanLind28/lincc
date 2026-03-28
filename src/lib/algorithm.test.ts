import { describe, it, expect } from 'vitest';
import {
  calculateDistanceScore,
  calculateTimeScore,
  calculateEngagementScore,
  calculatePopularityScore,
  calculateTimeOfDayScore,
  calculateTotalScore,
  hasInterestMatch,
  SCORE_WEIGHTS,
} from './algorithm';

describe('calculateDistanceScore', () => {
  it('returns max score at 0 distance', () => {
    expect(calculateDistanceScore(0, 10)).toBe(SCORE_WEIGHTS.distance);
  });

  it('returns 0 beyond radius', () => {
    expect(calculateDistanceScore(15, 10)).toBe(0);
  });

  it('returns 0 for negative distance', () => {
    expect(calculateDistanceScore(-1, 10)).toBe(0);
  });

  it('returns 0 for zero radius', () => {
    expect(calculateDistanceScore(5, 0)).toBe(0);
  });

  it('decays with distance', () => {
    const close = calculateDistanceScore(1, 10);
    const mid = calculateDistanceScore(5, 10);
    const far = calculateDistanceScore(9, 10);
    expect(close).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(far);
    expect(far).toBeGreaterThan(0);
  });
});

describe('calculateTimeScore', () => {
  it('returns 0 for past events', () => {
    const past = new Date(Date.now() - 60000);
    expect(calculateTimeScore(past)).toBe(0);
  });

  it('returns max for imminent events', () => {
    const soon = new Date(Date.now() + 60000); // 1 min from now
    expect(calculateTimeScore(soon)).toBe(SCORE_WEIGHTS.time);
  });

  it('decays over time with floor of 2', () => {
    const in1h = new Date(Date.now() + 3600000);
    const in12h = new Date(Date.now() + 43200000);
    const score1h = calculateTimeScore(in1h);
    const score12h = calculateTimeScore(in12h);
    expect(score1h).toBeGreaterThan(score12h);
    expect(score12h).toBeGreaterThanOrEqual(2);
  });

  it('accepts ISO string', () => {
    const soon = new Date(Date.now() + 60000).toISOString();
    expect(calculateTimeScore(soon)).toBe(SCORE_WEIGHTS.time);
  });
});

describe('calculateEngagementScore', () => {
  it('returns 0 for no past events', () => {
    expect(calculateEngagementScore(0)).toBe(0);
  });

  it('scales with event count', () => {
    expect(calculateEngagementScore(1)).toBe(2);
    expect(calculateEngagementScore(3)).toBe(6);
  });

  it('caps at max', () => {
    expect(calculateEngagementScore(100)).toBe(SCORE_WEIGHTS.engagement);
  });
});

describe('calculatePopularityScore', () => {
  it('returns 0 for empty events', () => {
    expect(calculatePopularityScore(0, 10)).toBe(0);
  });

  it('returns max for full events', () => {
    expect(calculatePopularityScore(10, 10)).toBe(SCORE_WEIGHTS.popularity);
  });

  it('scales proportionally', () => {
    const half = calculatePopularityScore(5, 10);
    const full = calculatePopularityScore(10, 10);
    expect(half).toBeLessThan(full);
    expect(half).toBeGreaterThan(0);
  });

  it('handles zero capacity', () => {
    expect(calculatePopularityScore(5, 0)).toBe(0);
  });
});

describe('calculateTimeOfDayScore', () => {
  it('returns max for preferred hours', () => {
    const date = new Date();
    date.setHours(18, 0, 0, 0);
    expect(calculateTimeOfDayScore(date, [17, 18, 19])).toBe(SCORE_WEIGHTS.timeOfDay);
  });

  it('returns 3 for adjacent hours', () => {
    const date = new Date();
    date.setHours(16, 0, 0, 0);
    expect(calculateTimeOfDayScore(date, [17, 18, 19])).toBe(3);
  });

  it('returns 1 for off-hours', () => {
    const date = new Date();
    date.setHours(6, 0, 0, 0);
    expect(calculateTimeOfDayScore(date, [17, 18, 19])).toBe(1);
  });

  it('uses defaults when no preferred hours', () => {
    const date = new Date();
    date.setHours(18, 0, 0, 0);
    expect(calculateTimeOfDayScore(date, [])).toBe(SCORE_WEIGHTS.timeOfDay);
  });
});

describe('calculateTotalScore', () => {
  it('returns sum of all scores', () => {
    const { total, breakdown } = calculateTotalScore({
      userTags: [],
      eventCategory: 'coffee',
      distanceKm: 0,
      userRadius: 10,
      startTime: new Date(Date.now() + 60000),
      categoryEventCount: 5,
      participantCount: 5,
      capacity: 10,
      preferredHours: [new Date().getHours()],
    });

    const sum = Object.values(breakdown).reduce((a, b) => a + b, 0);
    expect(total).toBe(sum);
  });
});

describe('hasInterestMatch', () => {
  it('returns true at threshold', () => {
    expect(hasInterestMatch(22)).toBe(true);
  });

  it('returns false below threshold', () => {
    expect(hasInterestMatch(21)).toBe(false);
  });
});
