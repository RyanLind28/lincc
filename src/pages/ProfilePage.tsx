import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout';
import { Avatar, Badge, GradientButton, EventCardMini, type EventCardEvent } from '../components/ui';
import { Edit2, Calendar, Ghost, Lock, Settings } from 'lucide-react';
import { calculateAge } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { getFollowerCount, getFollowingCount } from '../services/followService';

type EventTab = 'hosting' | 'joined';

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<EventTab>('hosting');
  const [hosting, setHosting] = useState<EventCardEvent[]>([]);
  const [joined, setJoined] = useState<EventCardEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

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
  const activeEvents = activeTab === 'hosting' ? hosting : joined;

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
        <div className="bg-surface rounded-2xl p-6 text-center mb-4">
          {/* Avatar with gradient ring */}
          <div className="flex justify-center mb-4">
            <div className="p-1 gradient-primary rounded-full">
              <div className="p-0.5 bg-surface rounded-full">
                <Avatar src={profile.avatar_url} name={profile.first_name} size="xl" />
              </div>
            </div>
          </div>

          {/* Name and age */}
          <h1 className="text-2xl font-bold text-text mb-1">
            {profile.first_name}, {age}
          </h1>

          {/* Bio */}
          {profile.bio && (
            <p className="text-text-muted text-sm max-w-xs mx-auto mb-4">{profile.bio}</p>
          )}

          {/* Stats row */}
          <div className="flex justify-center gap-6 py-4 border-t border-b border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-coral">{followerCount}</p>
              <p className="text-xs text-text-muted uppercase tracking-wide">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-coral">{followingCount}</p>
              <p className="text-xs text-text-muted uppercase tracking-wide">Following</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-coral">{hosting.length}</p>
              <p className="text-xs text-text-muted uppercase tracking-wide">Hosted</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-coral">{joined.length}</p>
              <p className="text-xs text-text-muted uppercase tracking-wide">Joined</p>
            </div>
          </div>

          {/* Interest tags */}
          {profile.tags && profile.tags.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Interests</p>
              <div className="flex flex-wrap justify-center gap-2">
                {profile.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Edit Profile button */}
          <div className="mt-4 flex justify-center">
            <Link to="/profile/edit">
              <GradientButton size="sm" leftIcon={<Edit2 className="h-4 w-4" />}>
                Edit Profile
              </GradientButton>
            </Link>
          </div>

          {/* Status indicators */}
          {(profile.is_ghost_mode || (profile.is_women_only_mode && profile.gender === 'female')) && (
            <div className="flex gap-2 flex-wrap justify-center mt-3">
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
        </div>

        {/* Event list */}
        <div className="space-y-3">
          {isLoading ? (
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
          ) : (
            <EmptyState
              title="No events joined"
              description="Browse events nearby and join one!"
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
