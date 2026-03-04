import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout';
import { Avatar, Badge, GradientButton, EventCardMini, VoucherTile, type EventCardEvent } from '../components/ui';
import { Edit2, Calendar, Ghost, Lock, Settings, Bookmark, Store, Tag, Plus, MapPin } from 'lucide-react';
import { calculateAge } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { getFollowerCount, getFollowingCount } from '../services/followService';
import { getVouchersByBusiness } from '../services/voucherService';
import { useBookmarks } from '../hooks/useBookmarks';
import { BusinessHoursDisplay } from '../components/business/BusinessHoursDisplay';
import type { VoucherWithDetails } from '../types';

type EventTab = 'hosting' | 'joined' | 'saved' | 'vouchers';

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<EventTab>('hosting');
  const [hosting, setHosting] = useState<EventCardEvent[]>([]);
  const [joined, setJoined] = useState<EventCardEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [businessVouchers, setBusinessVouchers] = useState<VoucherWithDetails[]>([]);
  const [isVouchersLoading, setIsVouchersLoading] = useState(false);
  const { savedEvents, loadSavedEvents, isLoading: isSavedLoading } = useBookmarks();

  // Load saved events when tab switches to 'saved'
  useEffect(() => {
    if (activeTab === 'saved') {
      loadSavedEvents();
    }
  }, [activeTab, loadSavedEvents]);

  // Load vouchers when tab switches to 'vouchers'
  useEffect(() => {
    if (activeTab === 'vouchers' && user?.id) {
      setIsVouchersLoading(true);
      getVouchersByBusiness(user.id).then((vouchers) => {
        setBusinessVouchers(vouchers);
        setIsVouchersLoading(false);
      });
    }
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    async function fetchUserEvents() {
      setIsLoading(true);

      // Fetch events hosted by user
      const { data: hostedData } = await supabase
        .from('events')
        .select(`
          id, title, venue_name, start_time, capacity, join_mode, participant_count,
          category:categories!category_id(name, icon),
          host:profiles!host_id(first_name, avatar_url)
        `)
        .eq('host_id', userId)
        .in('status', ['active', 'full'])
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      // Fetch events user has joined (approved participant)
      const { data: joinedData } = await supabase
        .from('event_participants')
        .select(`
          event:events!event_id(
            id, title, venue_name, start_time, capacity, join_mode, participant_count,
            category:categories!category_id(name, icon),
            host:profiles!host_id(first_name, avatar_url)
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'approved');

      // Fetch follower/following counts
      const [followers, followingCnt] = await Promise.all([
        getFollowerCount(userId),
        getFollowingCount(userId),
      ]);
      setFollowerCount(followers);
      setFollowingCount(followingCnt);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapEvent = (e: any): EventCardEvent => ({
        id: e.id as string,
        title: e.title as string,
        venue_name: e.venue_name as string,
        start_time: e.start_time as string,
        capacity: e.capacity as number,
        participant_count: (e.participant_count as number) || 0,
        join_mode: e.join_mode as 'instant' | 'request',
        category: e.category as { name: string; icon: string },
        host: e.host as { first_name: string; avatar_url?: string | null },
      });

      setHosting((hostedData || []).map(mapEvent));
      setJoined(
        (joinedData || [])
          .map((p: any) => p.event)
          .filter(Boolean)
          .map(mapEvent)
      );
      setIsLoading(false);
    }

    fetchUserEvents();
  }, [user]);

  if (!profile) {
    return null;
  }

  const age = calculateAge(profile.dob);

  // Map saved events to EventCardEvent format
  const savedEventCards: EventCardEvent[] = savedEvents.map((e) => ({
    id: e.id,
    title: e.title,
    venue_name: e.venue_name,
    start_time: e.start_time,
    capacity: e.capacity,
    participant_count: e.participant_count || 0,
    join_mode: e.join_mode as 'instant' | 'request',
    category: e.category as { name: string; icon: string },
    host: e.host as { first_name: string; avatar_url?: string | null },
  }));

  const activeEvents =
    activeTab === 'hosting' ? hosting :
    activeTab === 'joined' ? joined :
    savedEventCards;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header
        showLogo
        rightContent={
          <Link
            to="/settings"
            className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-gray-100 transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Link>
        }
      />

      {/* Profile card */}
      <div className="px-4 pt-4">
        <div className="bg-surface rounded-2xl p-6 mb-4">
          {/* Horizontal profile header: avatar left, info right */}
          <div className="flex gap-4 items-start">
            {/* Avatar with gradient ring */}
            <div className="shrink-0 h-[88px] w-[88px] gradient-primary rounded-full flex items-center justify-center">
              <div className="h-[84px] w-[84px] bg-surface rounded-full flex items-center justify-center">
                <Avatar src={profile.avatar_url} name={profile.first_name} size="xl" />
              </div>
            </div>

            {/* Info column */}
            <div className="min-w-0 flex-1">
              {/* Name + age + edit icon */}
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-text">
                  {profile.first_name}, {age}
                </h1>
                <Link to="/profile/edit" className="text-text-muted hover:text-coral transition-colors" aria-label="Edit Profile">
                  <Edit2 className="h-4 w-4" />
                </Link>
              </div>

              {/* Business badge */}
              {profile.is_business && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="primary" size="sm">
                    <Store className="h-3 w-3 mr-1" /> Business
                  </Badge>
                  {profile.business_category && (
                    <span className="text-xs text-text-muted">{profile.business_category}</span>
                  )}
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <p className="text-text-muted text-sm mt-1">{profile.bio}</p>
              )}

              {/* Business address */}
              {profile.is_business && profile.business_address && (
                <div className="flex items-center gap-1 text-sm text-text-muted mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>{profile.business_address}</span>
                </div>
              )}

              {/* Interest tags */}
              {profile.tags && profile.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {profile.tags.map((tag) => (
                    <Badge key={tag} variant="outline" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats row — full width */}
          <div className="flex justify-around py-4 mt-4 border-t border-b border-border">
            <Link to={`/user/${user?.id}/follows?tab=followers`} className="text-center hover:opacity-80 transition-opacity">
              <p className="text-2xl font-bold text-coral">{followerCount}</p>
              <p className="text-xs text-text-muted uppercase tracking-wide">Followers</p>
            </Link>
            <Link to={`/user/${user?.id}/follows?tab=following`} className="text-center hover:opacity-80 transition-opacity">
              <p className="text-2xl font-bold text-coral">{followingCount}</p>
              <p className="text-xs text-text-muted uppercase tracking-wide">Following</p>
            </Link>
            <div className="text-center">
              <p className="text-2xl font-bold text-coral">{hosting.length}</p>
              <p className="text-xs text-text-muted uppercase tracking-wide">Hosted</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-coral">{joined.length}</p>
              <p className="text-xs text-text-muted uppercase tracking-wide">Joined</p>
            </div>
          </div>

          {/* Status indicators */}
          {(profile.is_ghost_mode || (profile.is_women_only_mode && profile.gender === 'female')) && (
            <div className="flex gap-2 flex-wrap mt-3">
              {profile.is_ghost_mode && (
                <Badge variant="warning">
                  <Ghost className="h-3 w-3 mr-1" /> Ghost Mode
                </Badge>
              )}
              {profile.is_women_only_mode && profile.gender === 'female' && (
                <Badge variant="secondary">
                  <Lock className="h-3 w-3 mr-1" /> Women-Only
                </Badge>
              )}
            </div>
          )}

          {/* Business opening hours */}
          {profile.is_business && profile.business_opening_hours && (
            <div className="mt-4 pt-4 border-t border-border">
              <BusinessHoursDisplay hours={profile.business_opening_hours} />
            </div>
          )}
        </div>
      </div>

      {/* Events section */}
      <div className="px-4">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
          My Events
        </h2>

        {/* Tab pills */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('hosting')}
            className={`
              flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all
              ${activeTab === 'hosting'
                ? 'gradient-primary text-white shadow-sm'
                : 'bg-surface border border-border text-text-muted hover:border-coral hover:text-coral'
              }
            `}
          >
            Hosting
          </button>
          <button
            onClick={() => setActiveTab('joined')}
            className={`
              flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all
              ${activeTab === 'joined'
                ? 'gradient-primary text-white shadow-sm'
                : 'bg-surface border border-border text-text-muted hover:border-coral hover:text-coral'
              }
            `}
          >
            Joined
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`
              flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5
              ${activeTab === 'saved'
                ? 'gradient-primary text-white shadow-sm'
                : 'bg-surface border border-border text-text-muted hover:border-coral hover:text-coral'
              }
            `}
          >
            <Bookmark className="h-3.5 w-3.5" />
            Saved
          </button>
          {profile.is_business && (
            <button
              onClick={() => setActiveTab('vouchers')}
              className={`
                flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5
                ${activeTab === 'vouchers'
                  ? 'gradient-primary text-white shadow-sm'
                  : 'bg-surface border border-border text-text-muted hover:border-coral hover:text-coral'
                }
              `}
            >
              <Tag className="h-3.5 w-3.5" />
              Vouchers
            </button>
          )}
        </div>

        {/* Event/Voucher list */}
        <div className="space-y-3">
          {activeTab === 'vouchers' ? (
            isVouchersLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-coral border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-text-muted">Loading vouchers...</p>
              </div>
            ) : businessVouchers.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {businessVouchers.map((voucher) => (
                  <VoucherTile key={voucher.id} voucher={voucher} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No vouchers yet"
                description="Create your first voucher to attract customers!"
                actionLabel="Create Voucher"
                actionHref="/voucher/new"
              />
            )
          ) : (isLoading || (activeTab === 'saved' && isSavedLoading)) ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-coral border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-text-muted">Loading events...</p>
            </div>
          ) : activeEvents.length > 0 ? (
            activeEvents.map((event) => (
              <EventCardMini key={event.id} event={event} />
            ))
          ) : activeTab === 'hosting' ? (
            <EmptyState
              title="No events yet"
              description="Create your first event and meet new people!"
              actionLabel="Create Event"
              actionHref="/event/new"
            />
          ) : activeTab === 'joined' ? (
            <EmptyState
              title="No events joined"
              description="Browse events nearby and join one!"
              actionLabel="Browse Events"
              actionHref="/"
            />
          ) : (
            <EmptyState
              title="No saved events"
              description="Bookmark events you're interested in!"
              actionLabel="Browse Events"
              actionHref="/"
            />
          )}
        </div>
      </div>

      {/* Floating Create Voucher CTA */}
      {profile.is_business && (
        <Link
          to="/voucher/new"
          className="fixed bottom-24 right-4 z-40 w-14 h-14 gradient-primary rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
          aria-label="Create Voucher"
        >
          <Plus className="h-6 w-6 text-white" />
        </Link>
      )}
    </div>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center mx-auto mb-3">
        <Calendar className="h-6 w-6 text-white" />
      </div>
      <h3 className="font-semibold text-text mb-1">{title}</h3>
      <p className="text-sm text-text-muted mb-4">{description}</p>
      <Link to={actionHref}>
        <GradientButton size="sm">{actionLabel}</GradientButton>
      </Link>
    </div>
  );
}
