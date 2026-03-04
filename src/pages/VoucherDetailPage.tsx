import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Tag,
  ChevronDown,
  ChevronUp,
  Share2,
  Check,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getVoucherById, redeemVoucher, hasUserRedeemed } from '../services/voucherService';
import { GradientButton, Spinner, CategoryIcon, ScratchCard, SwipeToRedeem } from '../components/ui';
import { ShareVoucherSheet } from '../components/vouchers/ShareVoucherSheet';
import type { VoucherWithDetails } from '../types';

export default function VoucherDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [voucher, setVoucher] = useState<VoucherWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [codeRevealed, setCodeRevealed] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch voucher details
  useEffect(() => {
    const fetchVoucher = async () => {
      if (!id) return;
      setIsLoading(true);
      const data = await getVoucherById(id);
      setVoucher(data);
      setIsLoading(false);
    };
    fetchVoucher();
  }, [id]);

  // Check if already redeemed
  useEffect(() => {
    const checkRedemption = async () => {
      if (!id || !user?.id) return;
      const redeemed = await hasUserRedeemed(id, user.id);
      setIsRedeemed(redeemed);
      if (redeemed) {
        setShowCode(true);
        setCodeRevealed(true);
      }
    };
    checkRedemption();
  }, [id, user?.id]);

  const handleGetCode = () => {
    if (!user?.id) {
      showToast('Sign in to get voucher codes', 'error');
      return;
    }
    setShowCode(true);
  };

  const handleScratchRevealed = useCallback(() => {
    setCodeRevealed(true);
  }, []);

  const handleSwipeConfirm = useCallback(async () => {
    if (!voucher || !user?.id) return;

    const result = await redeemVoucher(voucher.id, user.id);

    if (result.success) {
      setIsRedeemed(true);
      setVoucher((prev) =>
        prev ? { ...prev, redemption_count: (prev.redemption_count || 0) + 1 } : prev
      );
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } else {
      showToast(result.error || 'Failed to redeem voucher', 'error');
      throw new Error('redeem failed'); // triggers SwipeToRedeem reset
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

  const formatExpiry = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (days <= 0) return 'Expired';
    if (days === 1) return 'Expires tomorrow';
    if (days <= 7) return `Expires in ${days} days`;
    return `Expires ${date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-text" />
          </button>
          <h1 className="text-lg font-semibold text-text truncate flex-1">Voucher Details</h1>
          <button
            onClick={() => setShowShareSheet(true)}
            className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-gray-100 transition-colors"
            aria-label="Share voucher"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pb-24">
        {/* Cover image or gradient placeholder */}
        {voucher.cover_image_url ? (
          <div className="relative h-48 overflow-hidden">
            <img
              src={voucher.cover_image_url}
              alt={voucher.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        ) : (
          <div className="h-48 gradient-primary flex items-center justify-center">
            {voucher.category && (
              <CategoryIcon icon={voucher.category.icon} size="lg" />
            )}
          </div>
        )}

        {/* Discount badge */}
        <div className="px-4 -mt-6 relative z-[1]">
          <div className="inline-block px-5 py-2.5 rounded-xl gradient-primary shadow-lg">
            <span className="text-2xl font-extrabold text-white">
              {voucher.discount_text}
            </span>
          </div>
        </div>

        <div className="px-4 pt-4 space-y-5">
          {/* Title + description */}
          <div>
            <h2 className="text-xl font-bold text-text mb-1">{voucher.title}</h2>
            {voucher.description && (
              <p className="text-sm text-text-muted leading-relaxed">{voucher.description}</p>
            )}
          </div>

          {/* Price section */}
          {(voucher.original_price != null || voucher.discounted_price != null) && (
            <div className="flex items-baseline gap-3 p-3 bg-coral/5 rounded-xl">
              {voucher.original_price != null && (
                <span className="text-lg text-text-muted line-through">
                  £{voucher.original_price.toFixed(2)}
                </span>
              )}
              {voucher.discounted_price != null && (
                <span className="text-2xl font-bold text-coral">
                  {voucher.discounted_price === 0 ? 'FREE' : `£${voucher.discounted_price.toFixed(2)}`}
                </span>
              )}
            </div>
          )}

          {/* Venue info */}
          <div className="p-3 bg-surface rounded-xl border border-border">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-coral/10 rounded-lg mt-0.5">
                <MapPin className="h-4 w-4 text-coral" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text text-sm">{voucher.venue_name}</p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(voucher.venue_address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-coral hover:underline"
                >
                  {voucher.venue_address}
                </a>
              </div>
            </div>
          </div>

          {/* Expiry */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className={`h-4 w-4 ${isExpired ? 'text-red-500' : 'text-text-muted'}`} />
            <span className={isExpired ? 'text-red-500 font-medium' : 'text-text-muted'}>
              {formatExpiry(voucher.expires_at)}
            </span>
          </div>

          {/* Redemption limit info */}
          {voucher.redemption_limit && (
            <div className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-text-muted" />
              <span className="text-text-muted">
                {voucher.redemption_count} / {voucher.redemption_limit} redeemed
              </span>
            </div>
          )}

          {/* Terms & conditions */}
          {voucher.terms && (
            <div className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setShowTerms(!showTerms)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-text hover:bg-gray-50 transition-colors"
              >
                <span>Terms & Conditions</span>
                {showTerms ? (
                  <ChevronUp className="h-4 w-4 text-text-muted" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-muted" />
                )}
              </button>
              {showTerms && (
                <div className="px-4 pb-3 text-xs text-text-muted leading-relaxed border-t border-border pt-3">
                  {voucher.terms}
                </div>
              )}
            </div>
          )}

          {/* Redeem / Code section */}
          {isRedeemed ? (
            <div className="p-5 bg-green-50 rounded-xl border border-green-200 animate-fade-in">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="h-5 w-5 text-white" strokeWidth={3} />
                </div>
                <p className="text-sm font-semibold text-green-700">Voucher Redeemed</p>
                <p className="text-xs text-green-600/70">You've successfully used this voucher</p>
              </div>
              <button
                onClick={() => setShowShareSheet(true)}
                className="flex items-center justify-center gap-2 w-full mt-4 py-2 text-sm
                           font-medium text-coral hover:bg-coral/5 rounded-lg transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Share with a friend
              </button>
            </div>
          ) : showCode && voucher.redemption_code ? (
            <div className="p-4 bg-surface rounded-xl border-2 border-dashed border-coral animate-fade-in space-y-4">
              <p className="text-xs text-text-muted text-center">Show this code to staff</p>
              <ScratchCard
                code={voucher.redemption_code}
                onRevealed={handleScratchRevealed}
              />

              {/* Swipe to confirm — only after code is revealed */}
              {codeRevealed && (
                <SwipeToRedeem onConfirm={handleSwipeConfirm} />
              )}
            </div>
          ) : isExpired ? (
            <button
              disabled
              className="w-full py-3.5 rounded-xl bg-gray-200 text-text-muted font-semibold text-center"
            >
              Voucher Expired
            </button>
          ) : (
            <GradientButton fullWidth onClick={handleGetCode}>
              Redeem Voucher
            </GradientButton>
          )}
        </div>
      </div>

      {/* Share Sheet */}
      <ShareVoucherSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        voucher={voucher}
      />

      {/* Success overlay with confetti */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
          {/* Confetti particles */}
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

          {/* Success card */}
          <div
            className="bg-white rounded-2xl p-8 mx-6 text-center shadow-2xl"
            style={{
              animation: 'success-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
          >
            <div
              className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4"
              style={{
                animation: 'check-scale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both',
              }}
            >
              <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text mb-2">Voucher Redeemed!</h3>
            <p className="text-sm text-text-muted">
              Your redemption has been confirmed. Enjoy your deal!
            </p>
          </div>

          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
            @keyframes success-pop {
              0% { transform: scale(0.3); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes check-scale {
              0% { transform: scale(0); }
              100% { transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
