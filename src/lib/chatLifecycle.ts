// Chat lifecycle helpers.
// PRD: events expire 2h after start_time; chat archives 24h after that.
// Surfaces use this to show the user where they are in the event's life cycle.

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export type ChatPhase = 'upcoming' | 'live' | 'archive_window' | 'archived';

export interface ChatLifecycle {
  phase: ChatPhase;
  /** ms from now until the next phase transition (start / end / archive) */
  msUntilNext: number;
}

export function getChatLifecycle(
  startTimeIso: string,
  expiresAtIso: string | null | undefined,
  nowMs: number = Date.now(),
): ChatLifecycle {
  const startMs = new Date(startTimeIso).getTime();
  // Fallback to start + 2h if expires_at isn't provided (matches DB trigger)
  const endMs = expiresAtIso ? new Date(expiresAtIso).getTime() : startMs + TWO_HOURS_MS;
  const archiveMs = endMs + TWENTY_FOUR_HOURS_MS;

  if (nowMs < startMs) return { phase: 'upcoming', msUntilNext: startMs - nowMs };
  if (nowMs < endMs) return { phase: 'live', msUntilNext: endMs - nowMs };
  if (nowMs < archiveMs) return { phase: 'archive_window', msUntilNext: archiveMs - nowMs };
  return { phase: 'archived', msUntilNext: 0 };
}

/**
 * Format a ms duration as a compact countdown string.
 *   5 days 3 hours → "5d 3h"
 *   3 hours 45 min → "3h 45m"
 *   12 min        → "12m"
 *   45 sec        → "<1m"
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'now';
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours < 24) return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}
