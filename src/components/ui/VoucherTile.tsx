import { MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { VoucherWithDetails } from '../../types';

export interface VoucherTileProps {
  voucher: VoucherWithDetails;
}

function getTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();

  if (diffMs <= 0) return 'Expired';

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d left`;
  if (hours > 0) return `${hours}h left`;
  return 'Expiring soon';
}

export function VoucherTile({ voucher }: VoucherTileProps) {
  const timeLeft = getTimeRemaining(voucher.expires_at);
  const isExpiringSoon = timeLeft.includes('h left') || timeLeft === 'Expiring soon';

  return (
    <Link
      to={`/voucher/${voucher.id}`}
      className="flex-shrink-0 w-[200px] block group"
    >
      <div
        className="
          relative bg-surface rounded-xl border border-border
          overflow-hidden transition-all
          group-hover:border-coral group-hover:shadow-md
        "
      >
        {/* Gradient accent bar */}
        <div className="h-1.5 gradient-primary" />

        {/* Content */}
        <div className="p-3.5">
          {/* Discount text */}
          <div className="text-xl font-extrabold gradient-text mb-1 leading-tight">
            {voucher.discount_text}
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-text truncate mb-2">
            {voucher.title}
          </h3>

          {/* Venue */}
          <div className="flex items-center gap-1.5 mb-2">
            <MapPin className="h-3 w-3 text-text-muted flex-shrink-0" />
            <span className="text-xs text-text-muted truncate">
              {voucher.venue_name}
            </span>
          </div>

          {/* Expiry */}
          <div className="flex items-center gap-1.5">
            <Clock className={`h-3 w-3 flex-shrink-0 ${isExpiringSoon ? 'text-coral' : 'text-text-muted'}`} />
            <span className={`text-xs font-medium ${isExpiringSoon ? 'text-coral' : 'text-text-muted'}`}>
              {timeLeft}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
