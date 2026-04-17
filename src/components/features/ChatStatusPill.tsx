import { Clock, Radio, Archive } from 'lucide-react';
import { getChatLifecycle, formatCountdown } from '../../lib/chatLifecycle';
import { cn } from '../../lib/utils';

interface ChatStatusPillProps {
  startTime: string;
  expiresAt?: string | null;
  /** Current epoch ms — pass in from useNow() so multiple pills tick together */
  nowMs: number;
  /** Larger variant for the chat room banner */
  variant?: 'inline' | 'banner';
}

/**
 * Shows the event's chat-lifecycle state:
 *   - upcoming       → "Starts in 2h 15m" (neutral)
 *   - live           → "Live now" (coral, pulsing)
 *   - archive_window → "Archives in 23h 45m" (amber — warning)
 *   - archived is never shown (chats are filtered out before reaching here)
 */
export function ChatStatusPill({ startTime, expiresAt, nowMs, variant = 'inline' }: ChatStatusPillProps) {
  const { phase, msUntilNext } = getChatLifecycle(startTime, expiresAt, nowMs);

  if (phase === 'archived') return null;

  const countdown = formatCountdown(msUntilNext);
  const isBanner = variant === 'banner';

  if (phase === 'upcoming') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium',
          isBanner
            ? 'px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200'
            : 'px-2 py-0.5 text-[11px] bg-surface border border-border text-text-muted'
        )}
      >
        <Clock className={isBanner ? 'h-4 w-4' : 'h-3 w-3'} />
        Starts in {countdown}
      </span>
    );
  }

  if (phase === 'live') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-semibold',
          isBanner
            ? 'px-3 py-1.5 text-sm bg-coral/10 text-coral border border-coral/30'
            : 'px-2 py-0.5 text-[11px] bg-coral/10 text-coral border border-coral/20'
        )}
      >
        <Radio className={cn(isBanner ? 'h-4 w-4' : 'h-3 w-3', 'animate-pulse')} />
        Live now
      </span>
    );
  }

  // archive_window — show the countdown prominently
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        isBanner
          ? 'px-3 py-1.5 text-sm bg-amber-50 text-amber-700 border border-amber-200'
          : 'px-2 py-0.5 text-[11px] bg-amber-50 text-amber-700 border border-amber-200'
      )}
      title="Chat archives 24 hours after the event ends"
    >
      <Archive className={isBanner ? 'h-4 w-4' : 'h-3 w-3'} />
      {isBanner ? 'Chat archives in ' : 'Archives in '}{countdown}
    </span>
  );
}
