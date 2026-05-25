import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, AlertTriangle, Star, Ticket, Share2, Building2,
  Clock, ChevronRight, Globe, ChevronLeft, Sparkles, Phone, Mail,
  Instagram, Facebook, Youtube, Linkedin, MessageCircle, AtSign,
} from 'lucide-react';
import { Header } from '../components/layout';
import { Avatar, Badge, GradientButton, EventDetailSkeleton } from '../components/ui';
import { VerifiedTick } from '../components/business/VerifiedTick';
import { BusinessHoursDisplay } from '../components/business/BusinessHoursDisplay';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  getBusinessById,
  getLocationsByBusiness,
  getBusinessPublicData,
  businessHref,
  type BusinessPublicEvent,
  type BusinessPublicReview,
} from '../services/businessService';
import { getActiveVouchersByBusiness } from '../services/voucherService';
import { formatRelativeTime } from '../lib/utils';
import type { BusinessWithOwner, BusinessLocation, VoucherWithDetails, BusinessOpeningHours } from '../types';

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${dim} ${i <= rating ? 'fill-warning text-warning' : 'text-muted'}`} />
      ))}
    </div>
  );
}

function getOpenStatus(hours: BusinessOpeningHours | null | undefined) {
  if (!hours) return null;
  const now = new Date();
  const today = DAY_KEYS[now.getDay()];
  const todayHours = hours[today as keyof BusinessOpeningHours];
  if (!todayHours) return { open: false, label: 'Closed today' as const };

  const [openH, openM] = todayHours.open.split(':').map(Number);
  const [closeH, closeM] = todayHours.close.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;

  if (nowMins >= openMins && nowMins < closeMins) {
    return { open: true, label: `Open now · until ${todayHours.close}` };
  }
  if (nowMins < openMins) {
    return { open: false, label: `Closed · opens ${todayHours.open}` };
  }
  return { open: false, label: 'Closed for the day' };
}

function EventTile({ event }: { event: BusinessPublicEvent; big?: boolean }) {
  const isPast = event.status === 'expired';
  const isFull = event.status === 'full' || (event.capacity > 0 && event.participant_count >= event.capacity);
  const fillPct = event.capacity > 0 ? Math.min(100, (event.participant_count / event.capacity) * 100) : 0;
  const start = new Date(event.start_time);
  const day = start.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
  const date = start.getDate();
  const month = start.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
  const time = start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <Link
      to={`/event/${event.id}`}
      className={`group flex bg-surface rounded-2xl border border-border overflow-hidden hover:border-coral/40 hover:shadow-md transition-all ${isPast ? 'opacity-70' : ''}`}
    >
      {/* Calendar-style date block (becomes a cover image when one exists) */}
      <div className="relative w-24 sm:w-28 flex-shrink-0 flex flex-col items-center justify-center bg-gradient-to-br from-coral/10 to-purple/10 border-r border-border">
        {event.cover_image_url && (
          <img
            src={event.cover_image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="relative text-center">
          <p className="text-[10px] font-bold tracking-widest text-coral">{day}</p>
          <p className="text-3xl font-extrabold text-text leading-none my-0.5">{date}</p>
          <p className="text-[10px] font-bold tracking-widest text-text-muted">{month}</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 p-3 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-muted flex items-center gap-1">
              <Clock className="h-3 w-3" /> {time}
            </p>
            <p className="font-semibold text-text leading-tight mt-0.5 truncate group-hover:text-coral transition-colors">
              {event.title}
            </p>
          </div>
          {isPast && <Badge size="sm" variant="default">Past</Badge>}
          {!isPast && isFull && <Badge size="sm" variant="warning">Full</Badge>}
        </div>

        <p className="text-xs text-text-muted truncate flex items-center gap-1 mt-1">
          <MapPin className="h-3 w-3 flex-shrink-0" /> {event.venue_name}
        </p>

        <div className="flex items-center gap-2 mt-auto pt-3">
          <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
            <div
              className={`h-full ${isFull ? 'bg-warning' : 'gradient-primary'}`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-text-muted whitespace-nowrap">
            {event.participant_count}/{event.capacity} spot{event.capacity === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ReviewCard({ review }: { review: BusinessPublicReview }) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 min-w-[280px] sm:min-w-[320px] snap-start">
      <div className="flex items-center gap-2 mb-2">
        <Avatar src={review.guest?.avatar_url ?? null} name={review.guest?.first_name ?? 'Guest'} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text">{review.guest?.first_name ?? 'Guest'}</p>
          <p className="text-xs text-text-light">{formatRelativeTime(review.created_at)}</p>
        </div>
        <StarRow rating={review.host_rating} />
      </div>
      {review.comment && <p className="text-sm text-text-muted line-clamp-4">{review.comment}</p>}
      {review.host_reply && (
        <div className="mt-3 pl-3 border-l-2 border-coral/40">
          <p className="text-xs font-medium text-coral">Owner replied</p>
          <p className="text-sm text-text-muted line-clamp-3">{review.host_reply}</p>
        </div>
      )}
    </div>
  );
}

function HorizontalScroller({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: 'smooth' });
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scroll(-1)}
        className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-surface border border-border shadow-md items-center justify-center hover:border-coral"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4 text-text" />
      </button>
      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1 -mx-4 px-4"
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => scroll(1)}
        className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-surface border border-border shadow-md items-center justify-center hover:border-coral"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4 text-text" />
      </button>
    </div>
  );
}

export default function BusinessPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [business, setBusiness] = useState<BusinessWithOwner | null>(null);
  const [vouchers, setVouchers] = useState<VoucherWithDetails[]>([]);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [events, setEvents] = useState<BusinessPublicEvent[]>([]);
  const [reviews, setReviews] = useState<BusinessPublicReview[]>([]);
  const [stats, setStats] = useState<{ hostRatingAvg: number | null; reviewCount: number; eventsHosted: number }>({
    hostRatingAvg: null, reviewCount: 0, eventsHosted: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const isOwner = user?.id === business?.owner_id;

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const biz = await getBusinessById(id);
      setBusiness(biz);

      if (biz) {
        const [v, locs, publicData] = await Promise.all([
          getActiveVouchersByBusiness(biz.id),
          getLocationsByBusiness(biz.id),
          getBusinessPublicData(biz.id),
        ]);
        setVouchers(v);
        setLocations(locs);
        setEvents(publicData.events);
        setReviews(publicData.reviews);
        setStats(publicData.stats);
      }
      setIsLoading(false);
    };

    load();
  }, [id]);

  const handleShare = async () => {
    if (!business) return;
    const url = `${window.location.origin}${businessHref(business)}`;
    if (navigator.share) {
      navigator.share({ title: business.name, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      showToast('Link copied', 'success');
    }
  };

  const upcomingEvents = useMemo(() => events.filter((e) => e.status !== 'expired'), [events]);
  const pastEvents = useMemo(() => events.filter((e) => e.status === 'expired'), [events]);
  const openStatus = useMemo(() => getOpenStatus(business?.opening_hours), [business?.opening_hours]);

  if (isLoading) return <EventDetailSkeleton />;

  if (!business) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack showLogo />
        <div className="flex flex-col items-center justify-center p-8 mt-20">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Business not found</h2>
          <p className="text-text-muted text-center mb-4 max-w-xs">
            This business page may have been removed.
          </p>
          <Link to="/businesses">
            <GradientButton>Browse businesses</GradientButton>
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background pb-12">
      <Header
        showBack
        showLogo
        showNotifications
        transparent
        rightContent={
          <button
            onClick={handleShare}
            className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-background transition-colors"
            aria-label="Share"
          >
            <Share2 className="h-5 w-5" />
          </button>
        }
      />

      {/* HERO */}
      <div className="relative">
        {/* Cover image / gradient — kept short and faded so chips below stay legible */}
        <div className="absolute inset-x-0 top-0 h-56 sm:h-64 overflow-hidden">
          {business.logo_url ? (
            <>
              <img src={business.logo_url} alt="" className="w-full h-full object-cover scale-110 blur-2xl opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-b from-coral/20 via-purple/10 to-background" />
            </>
          ) : (
            <div className="w-full h-full gradient-primary opacity-60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        </div>

        <div className="relative pt-20 sm:pt-32 px-4 max-w-5xl mx-auto">
          {/* Logo + identity row — stacked on mobile, side-by-side on sm+ */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6 items-center sm:items-start">
            {/* Logo */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-surface ring-4 ring-surface shadow-2xl overflow-hidden flex-shrink-0">
              {business.logo_url ? (
                <img src={business.logo_url} alt={business.name} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-primary flex items-center justify-center text-white font-bold text-5xl">
                  {business.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Identity column */}
            <div className="flex-1 min-w-0 mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-text tracking-tight inline-flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                {business.name}
                {business.verified && <VerifiedTick size="lg" />}
              </h1>

              <div className="flex items-center gap-2 mt-2 flex-wrap justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-text bg-surface border border-border shadow-sm rounded-full px-3 py-1">
                  <Building2 className="h-3.5 w-3.5 text-text-muted" />
                  {business.category}
                </span>
                {stats.hostRatingAvg !== null && (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-text bg-surface border border-warning/40 shadow-sm rounded-full px-3 py-1">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    {stats.hostRatingAvg.toFixed(1)}
                    <span className="text-text-muted text-xs">({stats.reviewCount})</span>
                  </span>
                )}
                {openStatus && (
                  <span className={`inline-flex items-center gap-1.5 text-sm font-medium rounded-full px-3 py-1 border shadow-sm ${
                    openStatus.open
                      ? 'bg-surface text-success border-success/40'
                      : 'bg-surface text-text-muted border-border'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${openStatus.open ? 'bg-success animate-pulse' : 'bg-text-light'}`} />
                    {openStatus.label}
                  </span>
                )}
              </div>

              {business.description && (
                <p className="text-text-muted mt-3 max-w-2xl mx-auto sm:mx-0">{business.description}</p>
              )}

              {/* Owner action only — share moved to header, "See what's on" moved
                  near the locations / hours block below */}
              {isOwner && (
                <div className="flex items-center gap-2 mt-4 flex-wrap justify-center sm:justify-start">
                  <Link to="/business/dashboard">
                    <GradientButton size="md">Manage business</GradientButton>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Stat strip */}
          <div className="mt-6 grid grid-cols-4 gap-2 bg-surface rounded-2xl border border-border p-3 shadow-sm">
            <div className="text-center">
              <p className="text-xl font-bold text-text">{stats.eventsHosted}</p>
              <p className="text-[11px] text-text-muted uppercase tracking-wide">Events</p>
            </div>
            <div className="text-center border-l border-border">
              <p className="text-xl font-bold text-text">{vouchers.length}</p>
              <p className="text-[11px] text-text-muted uppercase tracking-wide">Vouchers</p>
            </div>
            <div className="text-center border-l border-border">
              <p className="text-xl font-bold text-text">{locations.length}</p>
              <p className="text-[11px] text-text-muted uppercase tracking-wide">Location{locations.length === 1 ? '' : 's'}</p>
            </div>
            <div className="text-center border-l border-border">
              <p className="text-xl font-bold text-text">{stats.reviewCount}</p>
              <p className="text-[11px] text-text-muted uppercase tracking-wide">Reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN BODY */}
      <div className="px-4 max-w-5xl mx-auto mt-8 space-y-10">
        {/* What's on — upcoming events or owner prompt */}
        {upcomingEvents.length > 0 ? (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-text">What's on</h2>
              <span className="text-xs text-text-muted">{upcomingEvents.length} event{upcomingEvents.length === 1 ? '' : 's'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {upcomingEvents.map((e) => <EventTile key={e.id} event={e} />)}
            </div>
          </section>
        ) : isOwner && vouchers.length > 0 ? (
          <Link
            to="/event/new"
            className="flex items-center gap-4 p-5 bg-surface rounded-2xl border border-dashed border-border hover:border-coral/40 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-coral" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-text group-hover:text-coral transition-colors">Create your first event</p>
              <p className="text-xs text-text-muted">Post an activity and start attracting visitors</p>
            </div>
            <ChevronRight className="h-5 w-5 text-text-light" />
          </Link>
        ) : null}

        {/* Deals — full responsive grid (no fixed-width tiles) */}
        {vouchers.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-text">Vouchers</h2>
              <span className="text-xs text-text-muted">{vouchers.length} live</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vouchers.map((v) => {
                const limit = v.redemption_limit ?? 0;
                const claimed = v.redemption_count ?? 0;
                const pct = limit > 0 ? Math.min(100, (claimed / limit) * 100) : 0;
                return (
                  <Link
                    key={v.id}
                    to={`/voucher/${v.id}`}
                    className="group flex bg-surface rounded-2xl border border-border overflow-hidden hover:border-coral/40 hover:shadow-md transition-all"
                  >
                    <div className="w-28 sm:w-32 flex-shrink-0 relative">
                      {v.cover_image_url ? (
                        <img src={v.cover_image_url} alt={v.title} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full gradient-secondary flex items-center justify-center">
                          <Ticket className="h-7 w-7 text-white" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <span className="inline-block text-[11px] font-extrabold text-white bg-coral/95 backdrop-blur px-2 py-0.5 rounded">
                          {v.discount_text}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 p-3">
                      <p className="font-semibold text-text truncate group-hover:text-coral transition-colors">{v.title}</p>
                      {v.description && (
                        <p className="text-xs text-text-muted line-clamp-2 mt-0.5">{v.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {limit > 0 ? (
                          <>
                            <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                              <div className="h-full gradient-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[11px] text-text-muted whitespace-nowrap">{claimed}/{limit}</span>
                          </>
                        ) : (
                          <span className="text-[11px] text-text-muted">{claimed} redeemed</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Visit / contact section: hours + locations + socials */}
        {(
          locations.length > 0 ||
          business.address ||
          business.opening_hours ||
          business.social_links
        ) && (
          <section className="space-y-4">
            {/* Locations + Hours grid */}
            <div className="grid sm:grid-cols-2 gap-3">
              {(locations.length > 0 || business.address) && (
                <div>
                  <h2 className="text-lg font-bold text-text mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-coral" />
                    {locations.length > 1 ? `${locations.length} locations` : 'Find us'}
                  </h2>
                  {locations.length > 0 ? (
                    <div className="space-y-2">
                      {locations.map((loc) => (
                        <a
                          key={loc.id}
                          href={`https://maps.google.com/?q=${encodeURIComponent(loc.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border hover:border-coral/40 transition-colors"
                        >
                          <div className="w-9 h-9 bg-coral/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-4 w-4 text-coral" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text truncate">{loc.name}</p>
                            <p className="text-xs text-text-muted truncate">{loc.address}</p>
                          </div>
                          {loc.is_primary && (
                            <span className="text-[10px] font-medium text-coral bg-coral/10 px-2 py-0.5 rounded-full">Main</span>
                          )}
                        </a>
                      ))}
                    </div>
                  ) : (
                    business.address && (
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(business.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border hover:border-coral/40 transition-colors"
                      >
                        <div className="w-9 h-9 bg-coral/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-4 w-4 text-coral" />
                        </div>
                        <p className="text-sm text-text">{business.address}</p>
                      </a>
                    )
                  )}
                </div>
              )}

              {business.opening_hours && Object.keys(business.opening_hours).length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-text mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-coral" /> Hours
                  </h2>
                  <div className="bg-surface rounded-xl border border-border p-4">
                    {openStatus && (
                      <p className={`text-sm font-medium mb-3 ${openStatus.open ? 'text-success' : 'text-text-muted'}`}>
                        {openStatus.label}
                      </p>
                    )}
                    <BusinessHoursDisplay hours={business.opening_hours} />
                  </div>
                </div>
              )}
            </div>

            {/* Socials & contact */}
            {business.social_links && Object.values(business.social_links).some(Boolean) && (
              <div>
                <h2 className="text-lg font-bold text-text mb-3 flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-coral" /> Socials & contact
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(() => {
                    const s = business.social_links!;
                    const items: Array<{ key: string; href: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [];
                    if (s.website) items.push({ key: 'website', href: s.website, label: 'Website', icon: Globe });
                    if (s.instagram) items.push({ key: 'instagram', href: s.instagram, label: 'Instagram', icon: Instagram });
                    if (s.facebook) items.push({ key: 'facebook', href: s.facebook, label: 'Facebook', icon: Facebook });
                    if (s.x) items.push({ key: 'x', href: s.x, label: 'X', icon: AtSign });
                    if (s.tiktok) items.push({ key: 'tiktok', href: s.tiktok, label: 'TikTok', icon: MessageCircle });
                    if (s.linkedin) items.push({ key: 'linkedin', href: s.linkedin, label: 'LinkedIn', icon: Linkedin });
                    if (s.youtube) items.push({ key: 'youtube', href: s.youtube, label: 'YouTube', icon: Youtube });
                    if (s.whatsapp) items.push({ key: 'whatsapp', href: s.whatsapp, label: 'WhatsApp', icon: MessageCircle });
                    if (s.phone) items.push({ key: 'phone', href: `tel:${s.phone.replace(/\s+/g, '')}`, label: s.phone, icon: Phone });
                    if (s.email) items.push({ key: 'email', href: `mailto:${s.email}`, label: s.email, icon: Mail });
                    return items.map((item) => (
                      <a
                        key={item.key}
                        href={item.href}
                        target={item.href.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-surface rounded-xl border border-border hover:border-coral/40 transition-colors text-sm text-text"
                      >
                        <item.icon className="h-4 w-4 text-coral flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </a>
                    ));
                  })()}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Reviews carousel */}
        {reviews.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-text">What guests say</h2>
              {stats.hostRatingAvg !== null && (
                <span className="text-sm font-medium text-text inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  {stats.hostRatingAvg.toFixed(1)} <span className="text-text-muted text-xs">· {stats.reviewCount}</span>
                </span>
              )}
            </div>
            <HorizontalScroller>
              {reviews.slice(0, 10).map((r) => <ReviewCard key={r.id} review={r} />)}
            </HorizontalScroller>
          </section>
        )}

        {/* Past events */}
        {pastEvents.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-text mb-3">Previously hosted</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pastEvents.slice(0, 6).map((e) => <EventTile key={e.id} event={e} />)}
            </div>
          </section>
        )}

        {/* Empty state — owner vs visitor */}
        {events.length === 0 && vouchers.length === 0 && (
          isOwner ? (
            <section className="space-y-4">
              <div className="text-center py-6">
                <h2 className="text-xl font-bold text-text mb-2">Get started with {business.name}</h2>
                <p className="text-text-muted max-w-md mx-auto">
                  Your business page is live. Start posting to let people know what you offer.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  to="/event/new"
                  className="flex items-center gap-4 p-5 bg-surface rounded-2xl border border-border hover:border-coral/40 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text group-hover:text-coral transition-colors">Create your first event</p>
                    <p className="text-xs text-text-muted mt-0.5">Post an activity, class, opening, or meetup</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-text-light group-hover:text-coral transition-colors flex-shrink-0" />
                </Link>
                <Link
                  to="/voucher/new"
                  className="flex items-center gap-4 p-5 bg-surface rounded-2xl border border-border hover:border-coral/40 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl gradient-secondary flex items-center justify-center flex-shrink-0">
                    <Ticket className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text group-hover:text-coral transition-colors">Create a voucher or deal</p>
                    <p className="text-xs text-text-muted mt-0.5">Offer a discount, freebie, or promotion</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-text-light group-hover:text-coral transition-colors flex-shrink-0" />
                </Link>
              </div>
              <div className="bg-surface rounded-2xl border border-border p-5">
                <h3 className="font-semibold text-text mb-3">Tips for a great business page</h3>
                <div className="space-y-2.5">
                  {[
                    { done: !!business.logo_url, text: 'Add a logo' },
                    { done: !!business.description, text: 'Write a description' },
                    { done: !!business.address || locations.length > 0, text: 'Add your location' },
                    { done: !!business.opening_hours && Object.keys(business.opening_hours).length > 0, text: 'Set your opening hours' },
                    { done: !!business.social_links && Object.values(business.social_links).some(Boolean), text: 'Add social links' },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-success/10' : 'bg-muted'}`}>
                        {item.done ? (
                          <Star className="h-3 w-3 text-success" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-text-light" />
                        )}
                      </div>
                      <span className={`text-sm ${item.done ? 'text-text-muted line-through' : 'text-text'}`}>{item.text}</span>
                    </div>
                  ))}
                </div>
                <Link to="/business/edit" className="inline-block mt-4">
                  <GradientButton size="sm" variant="outline">Edit business profile</GradientButton>
                </Link>
              </div>
            </section>
          ) : (
            <section className="text-center py-12">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-text mb-2">Coming soon</h2>
              <p className="text-text-muted max-w-sm mx-auto mb-6">
                {business.name} is setting up. Check back soon for events, deals, and more.
              </p>
              {business.social_links?.instagram && (
                <a
                  href={business.social_links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-coral hover:text-coral/80 transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                  Follow on Instagram
                </a>
              )}
            </section>
          )
        )}
      </div>
    </div>
  );
}
