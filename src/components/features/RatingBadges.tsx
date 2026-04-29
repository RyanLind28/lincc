import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getHostRatingSummary, getGuestRatingSummary } from '../../services/reviews';

interface RatingBadgesProps {
  userId: string;
}

interface Summary {
  average: number | null;
  count: number;
}

export function RatingBadges({ userId }: RatingBadgesProps) {
  const [host, setHost] = useState<Summary>({ average: null, count: 0 });
  const [guest, setGuest] = useState<Summary>({ average: null, count: 0 });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getHostRatingSummary(userId),
      getGuestRatingSummary(userId),
    ]).then(([h, g]) => {
      if (cancelled) return;
      setHost(h);
      setGuest(g);
    });
    return () => { cancelled = true; };
  }, [userId]);

  if (host.count === 0 && guest.count === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {host.count > 0 && (
        <div className="inline-flex items-center gap-1.5 bg-warning/10 border border-warning/30 rounded-full px-3 py-1">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          <span className="text-sm font-medium text-text">{host.average?.toFixed(1)}</span>
          <span className="text-xs text-text-muted">as host · {host.count}</span>
        </div>
      )}
      {guest.count > 0 && (
        <div className="inline-flex items-center gap-1.5 bg-purple/10 border border-purple/30 rounded-full px-3 py-1">
          <Star className="h-3.5 w-3.5 fill-purple text-purple" />
          <span className="text-sm font-medium text-text">{guest.average?.toFixed(1)}</span>
          <span className="text-xs text-text-muted">as guest · {guest.count}</span>
        </div>
      )}
    </div>
  );
}
