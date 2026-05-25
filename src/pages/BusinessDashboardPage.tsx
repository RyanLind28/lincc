import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import {
  Pencil, Ticket, Eye, AlertTriangle, MapPin, X, Calendar,
  Star, Users, TrendingUp, Clock, Activity as ActivityIcon, Building2,
  Globe, ExternalLink, ShieldCheck,
} from 'lucide-react';
import { Header } from '../components/layout';
import { GradientButton, Badge, PlacesAutocomplete, Avatar } from '../components/ui';
import { VerifiedTick } from '../components/business/VerifiedTick';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useUserLocation } from '../hooks/useUserLocation';
import {
  addLocation,
  deleteLocation,
  getBusinessDashboardData,
  businessHref,
  type BusinessDashboardData,
  type BusinessDashboardEvent,
} from '../services/businessService';
import { formatRelativeTime } from '../lib/utils';
import type { PlaceDetails } from '../services/placesService';

type Tab = 'overview' | 'events' | 'vouchers' | 'locations' | 'reviews' | 'profile';

const STATUS_COPY: Record<string, { label: string; tone: 'success' | 'warning' | 'error' | 'default' }> = {
  pending_approval: { label: 'Unverified', tone: 'warning' },
  approved: { label: 'Verified', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'error' },
  suspended: { label: 'Suspended', tone: 'error' },
  inactive: { label: 'Inactive', tone: 'default' },
  archived: { label: 'Archived', tone: 'default' },
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= rating ? 'fill-warning text-warning' : 'text-muted'}`}
        />
      ))}
    </div>
  );
}

function StatCard({ label, value, accent, icon: Icon }: {
  label: string;
  value: string | number;
  accent?: 'coral' | 'purple' | 'success' | 'warning';
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const tones: Record<string, string> = {
    coral: 'text-coral bg-coral/10',
    purple: 'text-purple bg-purple/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
  };
  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold text-text">{value}</p>
          <p className="text-xs text-text-muted">{label}</p>
        </div>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tones[accent ?? 'coral']}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

function EventRow({ event }: { event: BusinessDashboardEvent }) {
  const isPast = event.status === 'expired';
  const fillPct = event.capacity > 0 ? Math.min(100, (event.participant_count / event.capacity) * 100) : 0;
  return (
    <Link
      to={`/event/${event.id}`}
      className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border hover:border-coral/40 transition-colors"
    >
      {event.cover_image_url ? (
        <img src={event.cover_image_url} alt={event.title} loading="lazy" className="w-14 h-14 rounded-lg object-cover" />
      ) : (
        <div className="w-14 h-14 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
          <Calendar className="h-5 w-5 text-white" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-medium truncate ${isPast ? 'text-text-muted' : 'text-text'}`}>{event.title}</p>
          {isPast && <Badge size="sm" variant="default">Past</Badge>}
          {event.status === 'cancelled' && <Badge size="sm" variant="error">Cancelled</Badge>}
        </div>
        <p className="text-xs text-text-muted">{new Date(event.start_time).toLocaleString()}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
            <div className="h-full gradient-primary" style={{ width: `${fillPct}%` }} />
          </div>
          <span className="text-xs text-text-muted">{event.participant_count}/{event.capacity}</span>
        </div>
      </div>
    </Link>
  );
}

export default function BusinessDashboardPage() {
  const navigate = useNavigate();
  const { business, profile, isBusinessApproved } = useAuth();
  const { showToast } = useToast();
  const { location: userLocation } = useUserLocation();

  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<BusinessDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationPlace, setNewLocationPlace] = useState<PlaceDetails | null>(null);
  const [isAddingLocation, setIsAddingLocation] = useState(false);

  const businessId = business?.id ?? '';

  const refresh = useCallback(async () => {
    if (!businessId) return;
    const fresh = await getBusinessDashboardData(businessId);
    setData(fresh);
    setIsLoading(false);
  }, [businessId]);

  useEffect(() => { refresh(); }, [refresh]);

  const handlePlaceSelect = (place: PlaceDetails) => {
    setNewLocationPlace(place);
    if (!newLocationName) setNewLocationName(place.name);
  };

  const handleSaveLocation = async () => {
    if (!businessId || !newLocationPlace || !newLocationName.trim()) {
      showToast('Please name the location and pick an address', 'error');
      return;
    }
    setIsAddingLocation(true);
    const result = await addLocation(businessId, {
      name: newLocationName.trim(),
      address: newLocationPlace.address,
      lat: newLocationPlace.lat,
      lng: newLocationPlace.lng,
    });
    setIsAddingLocation(false);
    if (result.success) {
      setShowAddLocation(false);
      setNewLocationName('');
      setNewLocationPlace(null);
      showToast('Location added', 'success');
      refresh();
    } else {
      showToast(result.error || 'Failed to add location', 'error');
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    const result = await deleteLocation(locationId);
    if (result.success) {
      showToast('Location removed', 'info');
      refresh();
    } else {
      showToast(result.error || 'Failed to delete', 'error');
    }
  };

  // Hours summary for the overview block
  const hoursSummary = useMemo(() => {
    const h = business?.opening_hours;
    if (!h) return null;
    const open = Object.entries(h).filter(([, v]) => v).length;
    return open > 0 ? `${open} day${open === 1 ? '' : 's'} a week` : null;
  }, [business?.opening_hours]);

  // Access guards
  if (profile && profile.account_type !== 'business') {
    return <Navigate to="/" replace />;
  }
  if (!business) {
    return (
      <div className="min-h-screen bg-background max-w-5xl mx-auto">
        <Header showBack showLogo />
        <div className="flex flex-col items-center justify-center p-8 mt-20">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-error" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">No business linked</h2>
          <p className="text-text-muted text-center mb-4">Contact support to attach your account to a business.</p>
          <GradientButton onClick={() => navigate('/')}>Home</GradientButton>
        </div>
      </div>
    );
  }

  const status = STATUS_COPY[business.status] ?? STATUS_COPY.inactive;

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-background max-w-5xl mx-auto">
        <Header showLogo showNotifications />
        <div className="p-4 max-w-5xl mx-auto space-y-3">
          <div className="h-32 bg-surface rounded-2xl border border-border animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-surface rounded-xl border border-border animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-surface rounded-2xl border border-border animate-pulse" />
        </div>
      </div>
    );
  }

  const { stats, locations, events, vouchers, recentActivity, recentHostReviews } = data;
  const activeEvents = events.filter((e) => e.status === 'active' || e.status === 'full');
  const pastEvents = events.filter((e) => e.status === 'expired');

  return (
    <div className="min-h-screen bg-background pb-12 max-w-5xl mx-auto">
      <Header showLogo showNotifications />

      <div className="p-4 space-y-6">
        {/* Hero */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-20 h-20 rounded-2xl bg-background overflow-hidden flex-shrink-0">
              {business.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-primary flex items-center justify-center text-white font-bold text-2xl">
                  {business.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-text truncate inline-flex items-center gap-1.5">
                  {business.name}
                  {business.verified && <VerifiedTick size="md" />}
                </h1>
                <Badge variant={status.tone}>{status.label}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-text-muted flex-wrap">
                <Building2 className="h-3.5 w-3.5" /> {business.category}
                {business.address && (<><span>·</span><MapPin className="h-3.5 w-3.5" /> <span className="truncate">{business.address}</span></>)}
                {hoursSummary && (<><span>·</span><Clock className="h-3.5 w-3.5" /> {hoursSummary}</>)}
              </div>
              {business.description && (
                <p className="text-sm text-text mt-2 line-clamp-2">{business.description}</p>
              )}
              {business.status === 'rejected' && business.rejection_reason && (
                <div className="mt-2 bg-error/5 border border-error/20 rounded-lg p-2 text-sm">
                  <p className="font-medium text-error">Rejection reason</p>
                  <p className="text-text">{business.rejection_reason}</p>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to="/business/edit">
                  <GradientButton size="sm" variant="outline">
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit profile
                  </GradientButton>
                </Link>
                <Link to="/business/verify">
                  <button className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-border text-text-muted hover:text-text text-sm font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </button>
                </Link>
                {isBusinessApproved && (
                  <Link to={businessHref(business)}>
                    <button className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-border text-text-muted hover:text-text text-sm font-medium">
                      <Eye className="h-3.5 w-3.5" /> Public page
                    </button>
                  </Link>
                )}
                {business.slug && (
                  <span className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-background text-text-muted text-xs">
                    <Globe className="h-3.5 w-3.5" /> /{business.slug}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Active events" value={stats.activeEvents} accent="coral" icon={Calendar} />
          <StatCard label="Active vouchers" value={stats.activeVouchers} accent="purple" icon={Ticket} />
          <StatCard label="Total redemptions" value={stats.totalRedemptions} accent="success" icon={TrendingUp} />
          <StatCard
            label={stats.hostRatingCount > 0 ? `Avg rating · ${stats.hostRatingCount} reviews` : 'No reviews yet'}
            value={stats.hostRatingAvg ? stats.hostRatingAvg.toFixed(1) : '–'}
            accent="warning"
            icon={Star}
          />
        </div>

        {/* Quick actions — only when approved */}
        {isBusinessApproved ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link to="/event/new">
              <div className="flex flex-col items-center gap-2 p-4 bg-surface rounded-xl border border-border hover:border-coral transition-colors">
                <Calendar className="h-5 w-5 text-coral" />
                <span className="text-xs font-medium text-text">New event</span>
              </div>
            </Link>
            <Link to="/voucher/new">
              <div className="flex flex-col items-center gap-2 p-4 bg-surface rounded-xl border border-border hover:border-coral transition-colors">
                <Ticket className="h-5 w-5 text-coral" />
                <span className="text-xs font-medium text-text">New voucher</span>
              </div>
            </Link>
            <button onClick={() => { setTab('locations'); setShowAddLocation(true); }} className="flex flex-col items-center gap-2 p-4 bg-surface rounded-xl border border-border hover:border-coral transition-colors">
              <MapPin className="h-5 w-5 text-coral" />
              <span className="text-xs font-medium text-text">Add location</span>
            </button>
            <Link to="/business/edit">
              <div className="flex flex-col items-center gap-2 p-4 bg-surface rounded-xl border border-border hover:border-coral transition-colors">
                <Pencil className="h-5 w-5 text-coral" />
                <span className="text-xs font-medium text-text">Edit profile</span>
              </div>
            </Link>
          </div>
        ) : (
          <div className="bg-warning/5 border border-warning/20 rounded-2xl p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-text">
                  {business.status === 'rejected' ? 'Application needs changes' : 'Get verified'}
                </h3>
                <p className="text-sm text-text-muted">
                  {business.status === 'rejected'
                    ? 'Update your details based on the feedback above and re-submit. We usually re-review within 24 hours.'
                    : 'You can publish events and vouchers once your business is verified. Upload your documents to speed it up.'}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link to="/business/verify">
                    <GradientButton size="sm">
                      {business.status === 'rejected' ? 'Re-submit' : 'Get verified'}
                    </GradientButton>
                  </Link>
                  <Link to="/business/edit">
                    <button className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-border text-text-muted hover:text-text text-sm font-medium">
                      <Pencil className="h-3.5 w-3.5" /> Edit profile
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab nav */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-border">
          {(['overview', 'events', 'vouchers', 'locations', 'reviews', 'profile'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors capitalize ${
                tab === t
                  ? 'border-coral text-coral'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Recent activity */}
            <section>
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">Recent activity</h2>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 bg-surface rounded-xl border border-border">
                  <ActivityIcon className="h-6 w-6 text-text-light mx-auto mb-2" />
                  <p className="text-sm text-text-muted">Activity will show up here as guests join, redeem, and review.</p>
                </div>
              ) : (
                <div className="bg-surface rounded-xl border border-border divide-y divide-border">
                  {recentActivity.map((a) => (
                    <div key={a.id} className="p-3 flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        a.type === 'redemption' ? 'bg-success/10 text-success'
                        : a.type === 'join' ? 'bg-coral/10 text-coral'
                        : 'bg-warning/10 text-warning'
                      }`}>
                        {a.type === 'redemption' && <Ticket className="h-4 w-4" />}
                        {a.type === 'join' && <Users className="h-4 w-4" />}
                        {a.type === 'review' && <Star className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text">{a.label}</p>
                        {a.detail && <p className="text-xs text-text-muted line-clamp-2 mt-0.5">{a.detail}</p>}
                        <p className="text-xs text-text-light mt-0.5">{formatRelativeTime(a.occurred_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Performance summary */}
            <section className="grid sm:grid-cols-2 gap-3">
              <div className="bg-surface rounded-xl border border-border p-4">
                <h3 className="text-xs font-semibold text-text-muted uppercase mb-2">Events</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-text-muted">Active</span><span className="text-text font-medium">{stats.activeEvents}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Past</span><span className="text-text font-medium">{stats.pastEvents}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Total guests</span><span className="text-text font-medium">{stats.totalParticipants}</span></div>
                </div>
              </div>
              <div className="bg-surface rounded-xl border border-border p-4">
                <h3 className="text-xs font-semibold text-text-muted uppercase mb-2">Reviews</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-text-muted">As host</span><span className="text-text font-medium">{stats.hostRatingAvg ? `${stats.hostRatingAvg} (${stats.hostRatingCount})` : '–'}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Event quality</span><span className="text-text font-medium">{stats.eventRatingAvg ? `${stats.eventRatingAvg} (${stats.eventRatingCount})` : '–'}</span></div>
                </div>
              </div>
            </section>
          </div>
        )}

        {tab === 'events' && (
          <div className="space-y-3">
            {!isBusinessApproved && (
              <p className="text-sm text-text-muted bg-warning/10 border border-warning/30 rounded-xl p-3">
                Your business needs to be verified before you can publish events.
              </p>
            )}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">Upcoming ({activeEvents.length})</h2>
              {isBusinessApproved && (
                <Link to="/event/new" className="text-sm text-coral font-medium">+ New event</Link>
              )}
            </div>
            {activeEvents.length === 0 ? (
              <div className="text-center py-8 bg-surface rounded-xl border border-border">
                <Calendar className="h-6 w-6 text-text-light mx-auto mb-2" />
                <p className="text-sm text-text-muted">No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeEvents.map((e) => <EventRow key={e.id} event={e} />)}
              </div>
            )}

            {pastEvents.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide pt-4">Past ({pastEvents.length})</h2>
                <div className="space-y-2">
                  {pastEvents.slice(0, 10).map((e) => <EventRow key={e.id} event={e} />)}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'vouchers' && (
          <div className="space-y-3">
            {!isBusinessApproved && (
              <p className="text-sm text-text-muted bg-warning/10 border border-warning/30 rounded-xl p-3">
                Your business needs to be verified before you can publish vouchers.
              </p>
            )}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">All vouchers ({vouchers.length})</h2>
              {isBusinessApproved && (
                <Link to="/voucher/new" className="text-sm text-coral font-medium">+ New voucher</Link>
              )}
            </div>
            {vouchers.length === 0 ? (
              <div className="text-center py-8 bg-surface rounded-xl border border-border">
                <Ticket className="h-6 w-6 text-text-light mx-auto mb-2" />
                <p className="text-sm text-text-muted">No vouchers yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {vouchers.map((v) => {
                  const limit = v.redemption_limit ?? 0;
                  const pct = limit > 0 ? Math.min(100, (v.redemption_count / limit) * 100) : 0;
                  return (
                    <Link
                      key={v.id}
                      to={`/voucher/${v.id}`}
                      className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border hover:border-coral/40 transition-colors"
                    >
                      {v.cover_image_url ? (
                        <img src={v.cover_image_url} alt={v.title} loading="lazy" className="w-14 h-14 rounded-lg object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg gradient-secondary flex items-center justify-center flex-shrink-0">
                          <Ticket className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-text truncate">{v.title}</p>
                          <Badge size="sm" variant={v.status === 'active' ? 'success' : 'default'}>{v.status}</Badge>
                        </div>
                        <p className="text-xs text-text-muted">{v.discount_text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {limit > 0 ? (
                            <>
                              <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                                <div className="h-full gradient-secondary" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-text-muted">{v.redemption_count}/{limit}</span>
                            </>
                          ) : (
                            <span className="text-xs text-text-muted">{v.redemption_count} redeemed</span>
                          )}
                        </div>
                        {v.expires_at && (
                          <p className="text-xs text-text-light mt-0.5">Expires {new Date(v.expires_at).toLocaleDateString()}</p>
                        )}
                      </div>
                      <ExternalLink className="h-4 w-4 text-text-light" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'locations' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">Locations ({locations.length})</h2>
              <button onClick={() => setShowAddLocation(!showAddLocation)} className="text-sm text-coral font-medium">
                {showAddLocation ? 'Cancel' : '+ Add'}
              </button>
            </div>

            {showAddLocation && (
              <div className="p-4 bg-surface rounded-xl border border-coral/30 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Location name</label>
                  <input
                    type="text"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    placeholder='e.g. "Soho Branch", "Main Store"'
                    maxLength={60}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Address</label>
                  <PlacesAutocomplete
                    onSelect={handlePlaceSelect}
                    userLocation={userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null}
                    placeholder="Search for the address..."
                  />
                </div>
                {newLocationPlace && (
                  <p className="text-xs text-text-muted">Selected: {newLocationPlace.address}</p>
                )}
                <GradientButton
                  fullWidth
                  size="sm"
                  onClick={handleSaveLocation}
                  isLoading={isAddingLocation}
                  disabled={!newLocationPlace || !newLocationName.trim()}
                >
                  Add location
                </GradientButton>
              </div>
            )}

            {locations.length === 0 ? (
              <div className="text-center py-8 bg-surface rounded-xl border border-border">
                <MapPin className="h-6 w-6 text-text-light mx-auto mb-2" />
                <p className="text-sm text-text-muted">No locations yet</p>
                <p className="text-xs text-text-light">Add one for chains or multiple branches</p>
              </div>
            ) : (
              <div className="space-y-2">
                {locations.map((loc) => (
                  <div key={loc.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
                    <MapPin className="h-4 w-4 text-coral flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{loc.name}</p>
                      <p className="text-xs text-text-muted truncate">{loc.address}</p>
                    </div>
                    {loc.is_primary && (
                      <span className="text-[10px] font-medium text-coral bg-coral/10 px-2 py-0.5 rounded-full">Primary</span>
                    )}
                    <button onClick={() => handleDeleteLocation(loc.id)} className="p-1 text-text-light hover:text-error transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'reviews' && (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-surface rounded-xl border border-border p-4 text-center">
                <p className="text-xs text-text-muted uppercase">Host rating</p>
                <p className="text-3xl font-bold text-text mt-1">{stats.hostRatingAvg?.toFixed(1) ?? '–'}</p>
                <p className="text-xs text-text-light">{stats.hostRatingCount} review{stats.hostRatingCount === 1 ? '' : 's'}</p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-4 text-center">
                <p className="text-xs text-text-muted uppercase">Event rating</p>
                <p className="text-3xl font-bold text-text mt-1">{stats.eventRatingAvg?.toFixed(1) ?? '–'}</p>
                <p className="text-xs text-text-light">{stats.eventRatingCount} review{stats.eventRatingCount === 1 ? '' : 's'}</p>
              </div>
            </div>

            {recentHostReviews.length === 0 ? (
              <div className="text-center py-8 bg-surface rounded-xl border border-border">
                <Star className="h-6 w-6 text-text-light mx-auto mb-2" />
                <p className="text-sm text-text-muted">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentHostReviews.map((r) => (
                  <div key={r.id} className="bg-surface rounded-xl border border-border p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar src={r.guest?.avatar_url ?? null} size="sm" />
                      <span className="text-sm font-medium text-text">{r.guest?.first_name ?? 'Guest'}</span>
                      <span className="text-xs text-text-light ml-auto">{formatRelativeTime(r.created_at)}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                      <span className="flex items-center gap-1">Host <StarRow rating={r.host_rating} /></span>
                      <span className="flex items-center gap-1">Event <StarRow rating={r.event_rating} /></span>
                    </div>
                    {r.comment && <p className="text-sm text-text mt-1">{r.comment}</p>}
                    {r.is_disputed && <Badge variant="warning" size="sm" className="mt-1">Disputed</Badge>}
                    {r.host_reply && (
                      <div className="mt-2 pl-3 border-l-2 border-coral/40 text-sm">
                        <p className="text-xs font-medium text-coral">You replied</p>
                        <p className="text-text-muted">{r.host_reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <div>
              <p className="text-xs text-text-muted uppercase">Description</p>
              <p className="text-sm text-text">{business.description || <span className="text-text-light">Not set</span>}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-muted uppercase">Category</p>
                <p className="text-sm text-text">{business.category}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase">Slug</p>
                <p className="text-sm text-text">{business.slug ?? <span className="text-text-light">Not set</span>}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase">Address</p>
                <p className="text-sm text-text">{business.address || <span className="text-text-light">Not set</span>}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase">Created</p>
                <p className="text-sm text-text">{new Date(business.created_at).toLocaleDateString()}</p>
              </div>
              {business.reviewed_at && (
                <div>
                  <p className="text-xs text-text-muted uppercase">Reviewed</p>
                  <p className="text-sm text-text">{new Date(business.reviewed_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            {business.opening_hours && Object.keys(business.opening_hours).length > 0 && (
              <div>
                <p className="text-xs text-text-muted uppercase mb-1">Opening hours</p>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  {Object.entries(business.opening_hours).map(([day, h]) => (
                    <div key={day} className="flex justify-between">
                      <span className="text-text-muted capitalize">{day}</span>
                      <span className="text-text">{h ? `${h.open}–${h.close}` : 'Closed'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Link to="/business/edit">
              <GradientButton fullWidth>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit business profile
              </GradientButton>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
