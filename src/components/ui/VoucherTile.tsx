import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import type { VoucherWithDetails } from '../../types';
import { VerifiedTick } from '../business/VerifiedTick';

export interface VoucherTileProps {
  voucher: VoucherWithDetails;
}

function timeRemaining(expiresAt: string): { label: string; urgent: boolean } {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { label: 'Expired', urgent: false };
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days >= 7) return { label: `${Math.floor(days / 7)}w left`, urgent: false };
  if (days >= 1) return { label: `${days}d left`, urgent: false };
  if (hours > 0) return { label: `${hours}h left`, urgent: true };
  return { label: 'Ending soon', urgent: true };
}

function savingsPercent(original: number | null | undefined, discounted: number | null | undefined): number | null {
  if (!original || original <= 0 || discounted == null) return null;
  if (discounted >= original) return null;
  return Math.round(((original - discounted) / original) * 100);
}

/**
 * Compact voucher card optimised for horizontal carousels (HomePage, business
 * profile, "more from this business" rail). Use `VoucherCard` for the larger
 * grid card with hero image and full pricing.
 */
export function VoucherTile({ voucher }: VoucherTileProps) {
  const time = timeRemaining(voucher.expires_at);
  const savings = savingsPercent(voucher.original_price, voucher.discounted_price);

  return (
    <Link
      to={`/voucher/${voucher.id}`}
      className="flex-shrink-0 w-[200px] block group"
    >
      <div className="relative bg-surface rounded-xl border border-border overflow-hidden transition-all group-hover:border-coral group-hover:shadow-md">
        {/* Cover */}
        <div className="relative aspect-[5/3] bg-muted overflow-hidden">
          {voucher.cover_image_url ? (
            <img
              src={voucher.cover_image_url}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 gradient-primary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-black/0" />

          {/* Discount badge */}
          <div className="absolute top-2 right-2">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg px-2 py-0.5 shadow-sm">
              <span className="text-sm font-extrabold gradient-text leading-none">
                {voucher.discount_text}
              </span>
            </div>
          </div>

          {/* Business pill */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5">
            {voucher.business?.logo_url ? (
              <img
                src={voucher.business.logo_url}
                alt=""
                className="w-4 h-4 rounded-full object-cover border border-white/40 shrink-0"
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-coral shrink-0" />
            )}
            <span className="text-[11px] font-medium text-white truncate drop-shadow">
              {voucher.business?.name ?? voucher.venue_name}
            </span>
            {voucher.business?.verified && <VerifiedTick size="xs" className="shrink-0" />}
          </div>
        </div>

        {/* Body */}
        <div className="p-3">
          <h3 className="text-sm font-semibold text-text line-clamp-2 leading-tight min-h-[2.5em]">
            {voucher.title}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-xs">
            {savings != null ? (
              <span className="font-semibold text-success">Save {savings}%</span>
            ) : voucher.discounted_price === 0 ? (
              <span className="font-semibold text-success">Free</span>
            ) : null}
            <span className={`ml-auto inline-flex items-center gap-1 ${time.urgent ? 'text-coral font-medium' : 'text-text-muted'}`}>
              <Clock className="h-3 w-3" />
              {time.label}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
