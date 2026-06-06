import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/layout';
import {
  MapPin,
  Clock,
  Tag,
  ChevronDown,
  ChevronUp,
  Share2,
  Check,
  Sparkles,
  Users,
  Calendar,
  Hash,
  Building2,
  ChevronRight,
  Info,
  AlertTriangle,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getVoucherById, redeemVoucher, hasUserRedeemed, getActiveVouchersByBusiness } from '../services/voucherService';
import { getLocationsByBusiness } from '../services/businessService';
import { GradientButton, Spinner, ScratchCard, SwipeToRedeem, Avatar, Badge, CoverImage } from '../components/ui';
import { VoucherTile } from '../components/ui/VoucherTile';
import { VerifiedTick } from '../components/business/VerifiedTick';
import { ShareVoucherSheet } from '../components/vouchers/ShareVoucherSheet';
import type { VoucherWithDetails, BusinessLocation } from '../types';

function formatExpiry(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Expired';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `${days} days left`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function VoucherDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [voucher, setVoucher] = useState<VoucherWithDetails | null>(null);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [otherVouchers, setOtherVouchers] = useState<VoucherWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchVoucher = async () => {
      if (!id) return;
      setIsLoading(true);
      const data = await getVoucherById(id);
      setVoucher(data);
      if (data?.business?.id) {
        const [locs, others] = await Promise.all([
          getLocationsByBusiness(data.business.id),
          getActiveVouchersByBusiness(data.business.id),
        ]);
        setLocations(locs);
        setOtherVouchers(others.filter((v) => v.id !== data.id));
      }
      setIsLoading(false);
    };
    fetchVoucher();
  }, [id]);

  useEffect(() => {
    const checkRedemption = async () => {
      if (!id || !user?.id) return;
      const redeemed = await hasUserRedeemed(id, user.id);
      setIsRedeemed(redeemed);
    };
    checkRedemption();
  }, [id, user?.id]);

  const handleSwipeConfirm = useCallback(async () => {
    if (!voucher || !user?.id) {
      showToast('Sign in to redeem vouchers', 'error');
      throw new Error('not signed in');
    }
    const result = await redeemVoucher(voucher.id, user.id);
    if (result.success) {
      setIsRedeemed(true);
      setVoucher((prev) => prev ? { ...prev, redemption_count: (prev.redemption_count || 0) + 1 } : prev);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } else {
      showToast(result.error || 'Failed to redeem voucher', 'error');
      throw new Error('redeem failed');
    }
  }, [voucher, user?.id, showToast]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background p-4">
        <p className="text-text-muted mb-4">Voucher not found</p>
        <GradientButton onClick={() => navigate('/')}>Go Home</GradientButton>
      </div>
    );
  }

  const isExpired = new Date(voucher.expires_at) <= new Date();
  const limit = voucher.redemption_limit ?? 0;
  const claimed = voucher.redemption_count ?? 0;
  const remaining = limit > 0 ? Math.max(0, limit - claimed) : null;
  const claimedPct = limit > 0 ? Math.min(100, (claimed / limit) * 100) : 0;
  const isAlmostGone = remaining !== null && remaining <= 5;

  const original = voucher.original_price;
  const discounted = voucher.discounted_price;
  const savings = original != null && discounted != null ? original - discounted : null;
  const savingsPct = savings != null && original != null && original > 0 ? Math.round((savings / original) * 100) : null;

  const daysLeft = Math.floor((new Date(voucher.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = !isExpired && daysLeft <= 7;

  return (
    <div className="min-h-screen bg-background max-w-5xl mx-auto pb-12">
      <Header
        showBack
        rightContent={
          <button
            onClick={() => setShowShareSheet(true)}
            className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-background transition-colors"
            aria-label="Share voucher"
          >
            <Share2 className="h-5 w-5" />
          </button>
        }
      />

      {/* Cover + discount badge */}
      <div className="relative">
        {voucher.cover_image_url ? (
          <div className="relative h-56 overflow-hidden">
            <CoverImage
              src={voucher.cover_image_url}
              categoryName={voucher.business?.category}
              alt={voucher.title}
              loading="eager"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        ) : (
          <div className="h-56 gradient-secondary flex items-center justify-center">
            {voucher.business?.logo_url ? (
              <img src={voucher.business.logo_url} alt={voucher.business.name} className="h-24 w-24 rounded-2xl object-cover" />
            ) : (
              <Building2 className="h-16 w-16 text-white/80" />
            )}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
          <div className="px-4 py-2.5 rounded-xl bg-white/95 backdrop-blur shadow-lg">
            <span className="text-2xl font-extrabold gradient-text">{voucher.discount_text}</span>
          </div>
          {voucher.business?.category && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-white bg-black/50 backdrop-blur px-3 py-1.5 rounded-full">
              <Tag className="h-3 w-3" /> {voucher.business.category}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Title + tagline */}
        <div>
          <h1 className="text-2xl font-bold text-text leading-tight">{voucher.title}</h1>
          {voucher.description && (
            <p className="text-sm text-text-muted mt-2 leading-relaxed">{voucher.description}</p>
          )}
        </div>

        {/* Status chips row */}
        <div className="flex flex-wrap gap-2">
          {isExpired && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-error bg-error/10 border border-error/30 rounded-full px-3 py-1">
              <AlertTriangle className="h-3 w-3" /> Expired
            </span>
          )}
          {isExpiringSoon && !isExpired && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning bg-warning/10 border border-warning/30 rounded-full px-3 py-1">
              <Clock className="h-3 w-3" /> Ends in {formatExpiry(voucher.expires_at)}
            </span>
          )}
          {isAlmostGone && !isExpired && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-coral bg-coral/10 border border-coral/30 rounded-full px-3 py-1">
              <Sparkles className="h-3 w-3" /> Only {remaining} left
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-text-muted bg-surface border border-border rounded-full px-3 py-1">
            <Users className="h-3 w-3" /> 1 per customer
          </span>
          {voucher.business && (
            <span className="inline-flex items-center gap-1 text-xs text-text-muted bg-surface border border-border rounded-full px-3 py-1">
              <Building2 className="h-3 w-3" /> Business offer
            </span>
          )}
        </div>

        {/* Hosted by — business card */}
        {voucher.business && (
          <Link
            to={`/business/${voucher.business.slug || voucher.business.id}`}
            className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border hover:border-coral/40 transition-colors group"
          >
            <Avatar src={voucher.business.logo_url} name={voucher.business.name} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted">Offered by</p>
              <p className="text-sm font-semibold text-text truncate group-hover:text-coral transition-colors inline-flex items-center gap-1">
                {voucher.business.name}
                {voucher.business.verified && <VerifiedTick size="sm" />}
              </p>
              <p className="text-xs text-text-muted truncate">{voucher.business.category}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-text-light flex-shrink-0" />
          </Link>
        )}

        {/* Savings card */}
        {savings != null && savings > 0 && (
          <div className="bg-gradient-to-br from-coral/10 to-purple/10 rounded-2xl border border-coral/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-coral" />
              <span className="text-xs font-semibold uppercase tracking-wide text-coral">You save</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-text">£{savings.toFixed(2)}</span>
              {savingsPct !== null && (
                <span className="text-sm font-medium text-coral">({savingsPct}% off)</span>
              )}
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              {original != null && (
                <span className="text-sm text-text-muted line-through">Was £{original.toFixed(2)}</span>
              )}
              {discounted != null && (
                <span className="text-sm font-semibold text-text">
                  Now {discounted === 0 ? 'FREE' : `£${discounted.toFixed(2)}`}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stock progress */}
        {limit > 0 && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted flex items-center gap-1">
                <Hash className="h-3 w-3" /> Availability
              </span>
              <span className="text-xs font-medium text-text">
                {claimed} of {limit} claimed
              </span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div
                className={`h-full ${isAlmostGone ? 'bg-coral' : 'gradient-primary'}`}
                style={{ width: `${claimedPct}%` }}
              />
            </div>
            <p className={`text-xs mt-2 font-medium ${isAlmostGone ? 'text-coral' : 'text-text-muted'}`}>
              {remaining} still available
            </p>
          </div>
        )}

        {/* Quick facts grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface rounded-xl border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
              <Calendar className="h-3 w-3" /> Expires
            </div>
            <p className={`text-sm font-semibold ${isExpired ? 'text-error' : 'text-text'}`}>
              {formatExpiry(voucher.expires_at)}
            </p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
              <Tag className="h-3 w-3" /> Category
            </div>
            <p className="text-sm font-semibold text-text">{voucher.business?.category ?? 'General'}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
              <Users className="h-3 w-3" /> Per customer
            </div>
            <p className="text-sm font-semibold text-text">1 use</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
              <Hash className="h-3 w-3" /> Total stock
            </div>
            <p className="text-sm font-semibold text-text">{limit > 0 ? limit : 'Unlimited'}</p>
          </div>
        </div>

        {/* Where to redeem — primary venue + multi-location list */}
        <div>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2 flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Where to redeem
          </h2>
          <div className="space-y-2">
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(voucher.venue_address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border hover:border-coral/40 transition-colors group"
            >
              <div className="p-2 bg-coral/10 rounded-lg mt-0.5">
                <MapPin className="h-4 w-4 text-coral" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-text text-sm truncate">{voucher.venue_name}</p>
                  <Badge variant="primary" size="sm">Primary</Badge>
                </div>
                <p className="text-xs text-text-muted truncate">{voucher.venue_address}</p>
                <span className="text-xs text-coral font-medium group-hover:underline">Open in maps →</span>
              </div>
            </a>
            {locations
              .filter((l) => l.address !== voucher.venue_address)
              .map((loc) => (
                <a
                  key={loc.id}
                  href={`https://maps.google.com/?q=${encodeURIComponent(loc.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border hover:border-coral/40 transition-colors group"
                >
                  <div className="p-2 bg-coral/10 rounded-lg mt-0.5">
                    <MapPin className="h-4 w-4 text-coral" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text text-sm truncate">{loc.name}</p>
                    <p className="text-xs text-text-muted truncate">{loc.address}</p>
                  </div>
                </a>
              ))}
          </div>
        </div>

        {/* Terms */}
        {voucher.terms && (
          <div className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setShowTerms(!showTerms)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-text hover:bg-background transition-colors"
            >
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4 text-text-muted" /> Terms & conditions
              </span>
              {showTerms ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
            </button>
            {showTerms && (
              <div className="px-4 pb-3 text-xs text-text-muted leading-relaxed border-t border-border pt-3 whitespace-pre-line">
                {voucher.terms}
              </div>
            )}
          </div>
        )}

        {/* Redeem / Code section.
            The code is only rendered once isRedeemed flips true — that prevents
            a user from scratching/screenshotting the code without ever calling
            the redeemVoucher RPC, which would let them bypass the per-user
            unique constraint and the redemption_limit counter. */}
        {isRedeemed ? (
          <div className="p-5 bg-success/10 rounded-xl border border-success/30 animate-fade-in space-y-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center">
                <Check className="h-5 w-5 text-white" strokeWidth={3} />
              </div>
              <p className="text-sm font-semibold text-success">Voucher redeemed</p>
              <p className="text-xs text-success/70 text-center">
                Show your code to staff at any participating location.
              </p>
            </div>
            {voucher.redemption_code && (
              <ScratchCard code={voucher.redemption_code} initialRevealed />
            )}
            <button
              onClick={() => setShowShareSheet(true)}
              className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-coral hover:bg-coral/5 rounded-lg transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share with a friend
            </button>
          </div>
        ) : isExpired ? (
          <button disabled className="w-full py-3.5 rounded-xl bg-muted text-text-muted font-semibold text-center">
            Voucher expired
          </button>
        ) : remaining === 0 ? (
          <button disabled className="w-full py-3.5 rounded-xl bg-muted text-text-muted font-semibold text-center">
            All redeemed
          </button>
        ) : (
          <div className="space-y-2">
            <SwipeToRedeem
              onConfirm={handleSwipeConfirm}
              label="Swipe to redeem voucher"
              confirmedLabel="Redeemed!"
            />
            <p className="text-xs text-text-muted text-center">
              Your code is revealed after you redeem.
            </p>
          </div>
        )}

        {/* Other vouchers from the same business */}
        {otherVouchers.length > 0 && voucher.business && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
                More from {voucher.business.name}
              </h2>
              <Link to={`/business/${voucher.business.slug || voucher.business.id}`} className="text-xs text-coral font-medium">
                View all →
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
              {otherVouchers.slice(0, 6).map((v) => <VoucherTile key={v.id} voucher={v} />)}
            </div>
          </div>
        )}
      </div>

      <ShareVoucherSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        voucher={voucher}
      />

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-5%',
                  backgroundColor: ['#FF6B6B', '#845EF7', '#5C7CFA', '#51CF66', '#FFD43B'][i % 5],
                  animation: `confetti-fall ${1.5 + Math.random() * 1.5}s ease-out forwards`,
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
          <div className="bg-surface rounded-2xl p-8 mx-6 text-center shadow-2xl" style={{ animation: 'success-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
            <div className="w-20 h-20 rounded-full bg-success flex items-center justify-center mx-auto mb-4" style={{ animation: 'check-scale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both' }}>
              <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text mb-2">Voucher redeemed!</h3>
            <p className="text-sm text-text-muted">Your redemption is confirmed. Enjoy your deal!</p>
          </div>
          <style>{`
            @keyframes confetti-fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
            @keyframes success-pop { 0% { transform: scale(0.3); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
            @keyframes check-scale { 0% { transform: scale(0); } 100% { transform: scale(1); } }
          `}</style>
        </div>
      )}
    </div>
  );
}
