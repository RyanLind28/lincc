import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout';
import { Avatar, Badge, GradientButton, EventCardMini, type EventCardEvent } from '../components/ui';
import { Edit2, Calendar, Ghost, Lock, Settings, Bookmark, Users, Sparkles, Share2 } from 'lucide-react';
import { calculateAge } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { getFollowerCount, getFollowingCount } from '../services/followService';
import { useWaitlistStatus } from '../hooks/useWaitlistStatus';
import { useBookmarks } from '../hooks/useBookmarks';
import { useToast } from '../contexts/ToastContext';
import { InstallAppCard } from '../components/pwa/InstallAppCard';

type EventTab = 'hosting' | 'joined' | 'saved';
type TimeFilter = 'upcoming' | 'past';

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const { showToast } = useToast();

  // Profile tab is for personal accounts only — business accounts have their
  // own dashboard. ProtectedRoute already gates pending businesses; this redirect
  // covers approved business accounts that hit /profile.
  if (profile?.account_type === 'business') {
    return <Navigate to="/business/dashboard" replace />;
  }
  const [activeTab, setActiveTab] = useState<EventTab>('hosting');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming');
  const [hosting, setHosting] = useState<EventCardEvent[]>([]);
  const [joined, setJoined] = useState<EventCardEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const { savedEvents, loadSavedEvents, isLoading: isSavedLoading } = useBookmarks();
  const waitlist = useWaitlistStatus();

  // Load saved events when tab switches to 'saved'
  useEffect(() => {
    if (activeTab === 'saved') {
      loadSavedEvents();
    }
  }, [activeTab, loadSavedEvents]);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    async function fetchUserEvents() {
      setIsLoading(true);

      // Fetch all events hosted by user (both upcoming and past — split client-side
      // so the Upcoming/Past pill can toggle without refetching).
      const { data: hostedData } = await supabase
        .from('events')
        .select(`
          id, title, venue_name, start_time, capacity, join_mode, participant_count, cover_image_url,
          category:categories!category_id(name, icon),
          host:profiles!host_id(first_name, avatar_url)
        `)
        .eq('host_id', userId)
        .in('status', ['active', 'full', 'expired'])
        .order('start_time', { ascending: false });

      // Fetch events user has joined (approved participant)
      const { data: joinedData } = await supabase
        .from('event_participants')
        .select(`
          event:events!event_id(
            id, title, venue_name, start_time, capacity, join_mode, participant_count, cover_image_url,
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
        cover_image_url: e.cover_image_url as string | null,
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

  // Split hosted + joined into upcoming/past using start_time relative to now.
  // Saved tab doesn't have a time filter — it shows all.
  const nowMs = Date.now();
  const isUpcoming = (e: EventCardEvent) => new Date(e.start_time).getTime() >= nowMs;
  const showTimeFilter = activeTab === 'hosting' || activeTab === 'joined';

  const filteredHosting = timeFilter === 'upcoming'
    ? hosting.filter(isUpcoming)
    : hosting.filter((e) => !isUpcoming(e));
  const filteredJoined = timeFilter === 'upcoming'
    ? joined.filter(isUpcoming)
    : joined.filter((e) => !isUpcoming(e));

  const activeEvents =
    activeTab === 'hosting' ? filteredHosting :
    activeTab === 'joined' ? filteredJoined :
    savedEventCards;

  const handleShare = async () => {
    const url = `${window.location.origin}/user/${user?.id}`;
    if (navigator.share) {
      navigator.share({ title: profile.first_name, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      showToast('Link copied', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header
        showLogo
        transparent
        rightContent={
          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-background transition-colors"
              aria-label="Share profile"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <Link
              to="/people"
              className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-background transition-colors"
              aria-label="Find people"
            >
              <Users className="h-5 w-5" />
            </Link>
            <Link
              to="/settings"
              className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-background transition-colors"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        }
      />

      {/* HERO — mirrors the business page */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-56 sm:h-64 overflow-hidden">
          {profile.avatar_url ? (
            <>
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover scale-110 blur-2xl opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-b from-coral/20 via-purple/10 to-background" />
            </>
          ) : (
            <div className="w-full h-full gradient-primary opacity-60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        </div>

        <div className="relative pt-20 sm:pt-32 px-4 max-w-4xl mx-auto">
          {/* Avatar + identity row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6 items-center">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-surface ring-4 ring-surface shadow-2xl overflow-hidden flex-shrink-0">
              <Avatar src={profile.avatar_url} name={profile.first_name} size="xl" className="!h-full !w-full !rounded-full" />
            </div>

            <div className="flex-1 min-w-0 mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-text tracking-tight">
                {profile.first_name}{age ? `, ${age}` : ''}
              </h1>

              <div className="flex items-center gap-2 mt-2 flex-wrap justify-center sm:justify-start">
                {waitlist.onWaitlist && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple bg-surface border border-purple/30 shadow-sm rounded-full px-3 py-1">
                    <Sparkles className="h-3 w-3" />
                    Early access
                  </span>
                )}
                {profile.is_ghost_mode && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-warning bg-surface border border-warning/30 shadow-sm rounded-full px-3 py-1">
                    <Ghost className="h-3 w-3" /> Ghost mode
                  </span>
                )}
                {profile.is_women_only_mode && profile.gender === 'female' && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-purple bg-surface border border-purple/30 shadow-sm rounded-full px-3 py-1">
                    <Lock className="h-3 w-3" /> Women-only
                  </span>
                )}
              </div>

              {profile.bio && (
                <p className="text-text-muted mt-3 max-w-2xl mx-auto sm:mx-0">{profile.bio}</p>
              )}

              {profile.tags && profile.tags.length > 0 && (
                <div className="flex gap-1.5 mt-3 overflow-x-auto scrollbar-hide flex-wrap justify-center sm:justify-start">
                  {profile.tags.map((tag) => (
                    <Badge key={tag} variant="outline" size="sm" className="whitespace-nowrap">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mt-4 flex-wrap justify-center sm:justify-start">
                <Link to="/profile/edit">
                  <GradientButton size="md">
                    <Edit2 className="h-4 w-4 mr-1" /> Edit profile
                  </GradientButton>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-6 grid grid-cols-4 gap-2 bg-surface rounded-2xl border border-border p-3 shadow-sm">
            <Link to={`/user/${user?.id}/follows?tab=followers`} className="text-center hover:opacity-80 transition-opacity">
              <p className="text-xl font-bold text-text">{followerCount}</p>
              <p className="text-[11px] text-text-muted uppercase tracking-wide">Followers</p>
            </Link>
            <Link to={`/user/${user?.id}/follows?tab=following`} className="text-center hover:opacity-80 transition-opacity border-l border-border">
              <p className="text-xl font-bold text-text">{followingCount}</p>
              <p className="text-[11px] text-text-muted uppercase tracking-wide">Following</p>
            </Link>
            <div className="text-center border-l border-border">
              <p className="text-xl font-bold text-text">{hosting.length}</p>
              <p className="text-[11px] text-text-muted uppercase tracking-wide">Hosted</p>
            </div>
            <div className="text-center border-l border-border">
              <p className="text-xl font-bold text-text">{joined.length}</p>
              <p className="text-[11px] text-text-muted uppercase tracking-wide">Joined</p>
            </div>
          </div>
        </div>
      </div>

      {/* Install app card */}
      <div className="px-4 max-w-4xl mx-auto mt-6">
        <InstallAppCard />
      </div>

      {/* Events section */}
      <div className="px-4 mt-6 max-w-4xl mx-auto">
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
        </div>

        {/* Upcoming / Past pill toggle — only on Hosting and Joined tabs */}
        {showTimeFilter && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTimeFilter('upcoming')}
              className={`flex-1 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                timeFilter === 'upcoming'
                  ? 'bg-coral/10 text-coral border border-coral/30'
                  : 'bg-surface border border-border text-text-muted hover:text-text'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setTimeFilter('past')}
              className={`flex-1 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                timeFilter === 'past'
                  ? 'bg-coral/10 text-coral border border-coral/30'
                  : 'bg-surface border border-border text-text-muted hover:text-text'
              }`}
            >
              Past
            </button>
          </div>
        )}

        {/* Event list */}
        <div className="space-y-3">
          {(isLoading || (activeTab === 'saved' && isSavedLoading)) ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-surface rounded-xl border border-border p-3 flex gap-3 animate-pulse">
                  <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeEvents.length > 0 ? (
            activeEvents.map((event) => (
              <EventCardMini key={event.id} event={event} />
            ))
          ) : activeTab === 'hosting' ? (
            <EmptyState
              title={timeFilter === 'past' ? 'No past events' : 'No events yet'}
              description={
                timeFilter === 'past'
                  ? "Events you host will appear here once they're over."
                  : 'Create your first event and meet new people!'
              }
              actionLabel={timeFilter === 'past' ? undefined : 'Create Event'}
              actionHref={timeFilter === 'past' ? undefined : '/event/new'}
            />
          ) : activeTab === 'joined' ? (
            <EmptyState
              title={timeFilter === 'past' ? 'No past events' : 'No events joined'}
              description={
                timeFilter === 'past'
                  ? "Events you've been to will show up here."
                  : 'Browse events nearby and join one!'
              }
              actionLabel={timeFilter === 'past' ? undefined : 'Browse Events'}
              actionHref={timeFilter === 'past' ? undefined : '/'}
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
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center mx-auto mb-3">
        <Calendar className="h-6 w-6 text-white" />
      </div>
      <h3 className="font-semibold text-text mb-1">{title}</h3>
      <p className="text-sm text-text-muted mb-4">{description}</p>
      {actionLabel && actionHref && (
        <Link to={actionHref}>
          <GradientButton size="sm">{actionLabel}</GradientButton>
        </Link>
      )}
    </div>
  );
}
