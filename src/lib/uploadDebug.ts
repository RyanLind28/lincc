// Lightweight, visible-on-device trace for the image upload pipeline.
//
// Phones kept hitting "pick a photo and nothing happens" that we couldn't
// reproduce on desktop. This emits a timestamped step log that an on-screen
// panel renders, so a single screen recording from a real phone shows exactly
// which step dies (input fired? bytes read? cropped? uploaded?).
//
// Pre-launch debugging aid. Gate the panel behind a flag before public launch.

// Stamped into the debug panel header so every screen recording proves which
// build it came from. Bump with every package.json bump.
export const APP_VERSION = '0.13.2';

export interface UploadLogLine {
  t: number;
  step: string;
  detail?: string;
}

let lines: UploadLogLine[] = [];
const listeners = new Set<(lines: UploadLogLine[]) => void>();

export function logUpload(step: string, detail?: string): void {
  // eslint-disable-next-line no-console
  try { console.log(`[upload] ${step}${detail ? ': ' + detail : ''}`); } catch { /* noop */ }
  lines = [...lines, { t: Date.now(), step, detail }].slice(-40);
  listeners.forEach((l) => l(lines));
}

export function clearUploadLog(): void {
  lines = [];
  listeners.forEach((l) => l(lines));
}

export function subscribeUploadLog(listener: (lines: UploadLogLine[]) => void): () => void {
  listeners.add(listener);
  listener(lines);
  return () => listeners.delete(listener);
}
