import { useEffect, useState } from 'react';

/**
 * Returns the current epoch ms, re-renders on each tick.
 * Default 30s interval — low overhead, smooth enough for minute-level countdowns.
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
