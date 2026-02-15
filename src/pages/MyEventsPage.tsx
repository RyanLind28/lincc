import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { GradientButton, Spinner, CategoryIcon, Avatar, Badge } from '../components/ui';
import { Calendar, Plus, Clock, MapPin, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { EventWithDetails } from '../types';

type Tab = 'hosting' | 'joined';

interface MyEvent extends EventWithDetails {
  participant_status?: string;
}

function formatEventTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 0) return 'Started';
  if (diffMins < 60) return `In ${diffMins}m`;
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function EventRow({ event, showStatus }: { event: MyEvent; showStatus?: boolean }) {
  const participantCount = typeof event.participant_count === 'number'
    ? event.participant_count
    : (event.participant_count as any)?.[0]?.count || 0;

  return (
    <Link
      to={`/event/${event.id}`}
      className="flex gap-3 p-4 bg-surface rounded-2xl border border-border hover:shadow-md transition-all group"
    >
      {/* Category icon */}
      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
        <CategoryIcon icon={event.category?.icon || 'Calendar'} size="lg" className="text-white" />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-text text-sm truncate group-hover:text-coral transition-colors">
            {event.title}
          </h3>
          {showStatus && event.participant_status === 'pending' && (
            <Badge variant="secondary">Pending</Badge>
          )}
          {event.status === 'cancelled' && (
            <Badge variant="outline">Cancelled</Badge>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-coral" />
            <span className="text-coral font-medium">{formatEventTime(event.start_time)}</span>
          </span>
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{event.venue_name}</span>
          </span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <Avatar
              src={event.host?.avatar_url}
              name={event.host?.first_name || 'Host'}
              size="xs"
            />
            <span className="text-xs text-text-muted">{event.host?.first_name}</span>
          </div>
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <Users className="h-3 w-3" />
            {participantCount + 1}/{event.capacity + 1}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function MyEventsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('hosting');
  const [hostingEvents, setHostingEvents] = useState<MyEvent[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<MyEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchEvents = async () => {
      setIsLoading(true);

      // Fetch events hosted by user
      const { data: hosted } = await supabase
        .from('events')
        .select(`
          *,
          host:profiles!host_id(*),
          category:categories!category_id(*),
          participant_count:event_participants(count)
        `)
        .eq('host_id', user.id)
        .order('start_time', { ascending: false });

      // Fetch events user has joined
      const { data: participations } = await supabase
        .from('event_participants')
        .select(`
          status,
          event:events!event_id(
            *,
            host:profiles!host_id(*),
            category:categories!category_id(*),
            participant_count:event_participants(count)
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['approved', 'pending']);

      setHostingEvents(
        (hosted || []).map((e) => ({
          ...e,
          participant_count: e.participant_count?.[0]?.count || 0,
        })) as MyEvent[]
      );

      setJoinedEvents(
        (participations || [])
          .filter((p) => p.event)
          .map((p) => {
            const evt = p.event as any;
            return {
              ...evt,
              participant_count: evt.participant_count?.[0]?.count || 0,
              participant_status: p.status,
            };
          })
          .sort((a: MyEvent, b: MyEvent) =>
            new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
          ) as MyEvent[]
      );

      setIsLoading(false);
    };

    fetchEvents();
  }, [user]);

  const events = activeTab === 'hosting' ? hostingEvents : joinedEvents;
  const isEmpty = !isLoading && events.length === 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header showLogo showCreateEvent showNotifications />

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('hosting')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors relative',
            activeTab === 'hosting'
              ? 'text-coral'
              : 'text-text-muted hover:text-text'
          )}
        >
          Hosting
          {hostingEvents.length > 0 && (
            <span className="ml-1.5 text-xs bg-coral/10 text-coral px-1.5 py-0.5 rounded-full">
              {hostingEvents.length}
            </span>
          )}
          {activeTab === 'hosting' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('joined')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors relative',
            activeTab === 'joined'
              ? 'text-coral'
              : 'text-text-muted hover:text-text'
          )}
        >
          Joined
          {joinedEvents.length > 0 && (
            <span className="ml-1.5 text-xs bg-coral/10 text-coral px-1.5 py-0.5 rounded-full">
              {joinedEvents.length}
            </span>
          )}
          {activeTab === 'joined' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-text mb-2">
              {activeTab === 'hosting' ? 'No events hosted' : 'No events joined'}
            </h2>
            <p className="text-text-muted text-center max-w-xs mb-6">
              {activeTab === 'hosting'
                ? 'Create an event to start connecting with others.'
                : "Browse events to find something you'd like to join."}
            </p>
            <Link to={activeTab === 'hosting' ? '/event/new' : '/'}>
              <GradientButton leftIcon={activeTab === 'hosting' ? <Plus className="h-4 w-4" /> : undefined}>
                {activeTab === 'hosting' ? 'Create Event' : 'Browse Events'}
              </GradientButton>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                showStatus={activeTab === 'joined'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
