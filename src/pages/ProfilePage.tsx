import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout';
import { Avatar, Badge, GradientButton, EventCardMini, type EventCardEvent } from '../components/ui';
import { Edit2, Calendar, Users, Ghost, Lock } from 'lucide-react';
import { calculateAge } from '../lib/utils';
import { supabase } from '../lib/supabase';

type EventTab = 'hosting' | 'joined';

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<EventTab>('hosting');
  const [hosting, setHosting] = useState<EventCardEvent[]>([]);
  const [joined, setJoined] = useState<EventCardEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

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
        .eq('host_id', user.id)
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
        .eq('user_id', user.id)
        .eq('status', 'approved');

      const mapEvent = (e: Record<string, unknown>): EventCardEvent => ({
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
          .map((p) => p.event)
          .filter(Boolean)
          .map((e) => mapEvent(e as Record<string, unknown>))
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
      <Header showLogo showCreateEvent showNotifications />

      {/* Profile header - centered layout */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex flex-col items-center text-center">
          {/* Avatar with gradient ring */}
          <div className="relative mb-4">
            <div className="p-1 gradient-primary rounded-full">
              <div className="p-1 bg-surface rounded-full">
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
            <p className="text-text-muted max-w-xs mb-4">{profile.bio}</p>
          )}

          {/* Interest tags */}
          {profile.tags && profile.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {profile.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-coral/10 text-coral rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Edit Profile button */}
          <Link to="/profile/edit" className="mb-4">
            <GradientButton size="sm" leftIcon={<Edit2 className="h-4 w-4" />}>
              Edit Profile
            </GradientButton>
          </Link>

          {/* Status indicators */}
          <div className="flex gap-2 flex-wrap justify-center">
            {profile.is_ghost_mode && (
              <Badge variant="warning">
                <Ghost className="h-3 w-3 mr-1" /> Ghost Mode
              </Badge>
            )}
            {profile.is_women_only_mode && profile.gender === 'woman' && (
              <Badge variant="secondary">
                <Lock className="h-3 w-3 mr-1" /> Women-Only
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 mb-6">
        <div className="flex gap-4 justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-xl border border-border">
            <Calendar className="h-4 w-4 text-coral" />
            <span className="text-sm font-medium text-text">{hosting.length} hosted</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-xl border border-border">
            <Users className="h-4 w-4 text-purple" />
            <span className="text-sm font-medium text-text">{joined.length} joined</span>
          </div>
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
