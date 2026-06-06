import { Link } from 'react-router-dom';
import { MapPin, Clock, Flame, Sparkles, BadgeCheck } from 'lucide-react';
import type { VoucherWithDetails } from '../../types';
import { VerifiedTick } from '../business/VerifiedTick';
import { CoverImage } from './CoverImage';

export interface VoucherCardProps {
  voucher: VoucherWithDetails;
  /** "default" is the rich card; "featured" is the larger hero variant. */
  variant?: 'default' | 'featured';
  className?: string;
}

function timeRemaining(expiresAt: string): { label: string; urgent: boolean; expired: boolean } {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { label: 'Expired', urgent: false, expired: true };
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days >= 7) return { label: `${Math.floor(days / 7)}w left`, urgent: false, expired: false };
  if (days >= 1) return { label: `${days}d left`, urgent: false, expired: false };
  if (hours > 0) return { label: `${hours}h left`, urgent: true, expired: false };
  return { label: 'Ending soon', urgent: true, expired: false };
}

function savingsPercent(original: number | null, discounted: number | null): number | null {
  if (!original || original <= 0 || discounted == null) return null;
  if (discounted >= original) return null;
  return Math.round(((original - discounted) / original) * 100);
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);
}

export function VoucherCard({ voucher, variant = 'default', className = '' }: VoucherCardProps) {
  const time = timeRemaining(voucher.expires_at);
  const savings = savingsPercent(voucher.original_price ?? null, voucher.discounted_price ?? null);
  const isFree = voucher.discounted_price === 0;
  const isNew = (Date.now() - new Date(voucher.created_at).getTime()) < 3 * 86_400_000;

  const claimed = voucher.redemption_count ?? 0;
  const limit = voucher.redemption_limit ?? null;
  const claimedPct = limit && limit > 0 ? Math.min(100, Math.round((claimed / limit) * 100)) : null;
  const almostGone = claimedPct !== null && claimedPct >= 80;

  const featured = variant === 'featured';

  return (
    <Link
      to={`/voucher/${voucher.id}`}
      className={`group block bg-surface rounded-2xl border border-border overflow-hidden hover:border-coral/50 hover:shadow-lg transition-all ${className}`}
    >
      {/* Cover image */}
      <div className={`relative w-full bg-muted overflow-hidden ${featured ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
        <CoverImage
          src={voucher.cover_image_url}
          categoryName={voucher.business?.category}
          alt={voucher.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Bottom shading for legibility of overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/30" />

        {/* Status chips (top-left) */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 max-w-[70%]">
          {time.urgent && !time.expired && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-coral text-white shadow-md">
              <Flame className="h-3 w-3" /> Ending soon
            </span>
          )}
          {!time.urgent && isNew && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-purple text-white shadow-md">
              <Sparkles className="h-3 w-3" /> New
            </span>
          )}
          {almostGone && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-warning text-white shadow-md">
              {claimedPct}% claimed
            </span>
          )}
        </div>

        {/* Discount badge (top-right) */}
        <div className="absolute top-2.5 right-2.5">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1 shadow-md">
            <p className={`font-extrabold gradient-text leading-none ${featured ? 'text-2xl' : 'text-lg'}`}>
              {voucher.discount_text}
            </p>
          </div>
        </div>

        {/* Business pill (bottom-left) */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-2">
          <div className="flex items-center gap-2 bg-black/45 backdrop-blur-sm rounded-full pl-1 pr-2.5 py-1 max-w-full">
            {voucher.business?.logo_url ? (
              <img
                src={voucher.business.logo_url}
                alt=""
                className="w-5 h-5 rounded-full object-cover border border-white/30"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-coral/80 flex items-center justify-center text-white text-[9px] font-bold">
                {voucher.business?.name?.charAt(0).toUpperCase() ?? '?'}
              </div>
            )}
            <span className="text-[11px] font-medium text-white truncate">
              {voucher.business?.name ?? 'Local business'}
            </span>
            {voucher.business?.verified && <VerifiedTick size="xs" />}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={`p-3.5 ${featured ? 'sm:p-5' : ''}`}>
        <h3 className={`font-semibold text-text line-clamp-2 ${featured ? 'text-base sm:text-lg' : 'text-sm'}`}>
          {voucher.title}
        </h3>

        {/* Price + savings */}
        {(voucher.original_price != null || voucher.discounted_price != null) && (
          <div className="flex items-baseline gap-2 mt-2">
            {voucher.discounted_price != null && (
              <span className={`font-bold text-text ${featured ? 'text-xl' : 'text-base'}`}>
                {isFree ? 'Free' : formatPrice(voucher.discounted_price)}
              </span>
            )}
            {voucher.original_price != null && voucher.original_price > (voucher.discounted_price ?? 0) && (
              <span className="text-xs text-text-muted line-through tabular-nums">
                {formatPrice(voucher.original_price)}
              </span>
            )}
            {savings != null && (
              <span className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-semibold bg-success/10 text-success">
                <BadgeCheck className="h-3 w-3" /> Save {savings}%
              </span>
            )}
          </div>
        )}

        {/* Stock progress */}
        {claimedPct !== null && (
          <div className="mt-2.5">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${almostGone ? 'bg-coral' : 'gradient-primary'}`}
                style={{ width: `${claimedPct}%` }}
              />
            </div>
            <p className="text-[10px] text-text-muted mt-1 tabular-nums">
              {claimed} of {limit} claimed
            </p>
          </div>
        )}

        {/* Footer meta */}
        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-text-muted">
          <span className="inline-flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{voucher.venue_name}</span>
          </span>
          <span className={`inline-flex items-center gap-1 ml-auto shrink-0 ${time.urgent ? 'text-coral font-medium' : ''}`}>
            <Clock className="h-3 w-3" /> {time.label}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function VoucherCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden animate-pulse">
      <div className={`w-full bg-muted ${featured ? 'aspect-[16/9]' : 'aspect-[4/3]'}`} />
      <div className="p-3.5 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-1.5 bg-muted rounded w-full" />
      </div>
    </div>
  );
}
