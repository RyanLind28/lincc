import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { GradientButton, Spinner, CategoryIcon, Badge } from '../components/ui';
import { Calendar, Plus, Clock, MapPin, Users, Send, Trash2, ChevronRight, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { publishDraft, deleteEvent } from '../services/events';
import type { EventWithDetails } from '../types';

type Tab = 'hosting' | 'joined' | 'drafts';

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

function EventRow({ event, showStatus, isPast }: { event: MyEvent; showStatus?: boolean; isPast?: boolean }) {
  const participantCount = typeof event.participant_count === 'number'
    ? event.participant_count
    : (event.participant_count as any)?.[0]?.count || 0;
  const totalSpots = event.capacity + 1; // +1 for host
  const filledSpots = Math.min(participantCount + 1, totalSpots);
  const coverUrl = (event as MyEvent & { cover_image_url?: string | null }).cover_image_url;

  return (
    <Link
      to={`/event/${event.id}`}
      className={cn(
        "group flex items-center gap-3 p-3 bg-surface rounded-2xl border border-border hover:border-coral/50 hover:shadow-sm transition-all",
        isPast && "opacity-50"
      )}
    >
      {/* Cover image — matches chat row / profile card treatment */}
      <div className="relative flex-shrink-0">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={event.title}
            loading="lazy"
            className="w-16 h-16 rounded-xl object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center">
            <CategoryIcon icon={event.category?.icon || 'Calendar'} size="lg" className="text-white" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-text truncate group-hover:text-coral transition-colors">
            {event.title}
          </h3>
          {showStatus && event.participant_status === 'pending' && (
            <Badge variant="secondary" className="flex-shrink-0">Pending</Badge>
          )}
          {event.status === 'cancelled' && (
            <Badge variant="outline" className="flex-shrink-0">Cancelled</Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted mt-1 min-w-0">
          <span className="flex items-center gap-1 flex-shrink-0 text-coral font-medium">
            <Clock className="h-3 w-3" />
            {formatEventTime(event.start_time)}
          </span>
          {event.venue_name && (
            <>
              <span className="text-text-light">·</span>
              <span className="flex items-center gap-1 min-w-0">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{event.venue_name}</span>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
          <Users className="h-3 w-3" />
          <span>{filledSpots}/{totalSpots} going</span>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-text-light group-hover:text-coral transition-colors flex-shrink-0" />
    </Link>
  );
}

function DraftRow({
  event,
  isPending,
  onPublish,
  onDelete,
}: {
  event: MyEvent;
  isPending: boolean;
  onPublish: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="p-4 bg-surface rounded-2xl border border-border">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
          <CategoryIcon icon={event.category?.icon || 'Calendar'} size="lg" className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-text text-sm truncate">{event.title}</h3>
            <Badge variant="outline">Draft</Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{new Date(event.start_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
            </span>
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{event.venue_name}</span>
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <GradientButton
          size="sm"
          fullWidth
          onClick={onPublish}
          isLoading={isPending}
          leftIcon={<Send className="h-4 w-4" />}
        >
          Publish
        </GradientButton>
        <button
          onClick={onDelete}
          disabled={isPending}
          className="px-3 rounded-xl border border-border text-text-muted hover:text-error hover:border-error transition-colors disabled:opacity-50"
          aria-label="Delete draft"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function MyEventsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('hosting');
  const [hostingEvents, setHostingEvents] = useState<MyEvent[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<MyEvent[]>([]);
  const [draftEvents, setDraftEvents] = useState<MyEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!user) return;
    setIsLoading(true);

    // Fetch all events hosted by user (exclude drafts)
    const { data: hosted } = await supabase
      .from('events')
      .select(`
        *,
        host:profiles!host_id(*),
        category:categories!category_id(*),
        participant_count:event_participants(count)
      `)
      .eq('host_id', user.id)
      .in('status', ['active', 'full'])
      .order('start_time', { ascending: false });

    // Fetch the user's own drafts
    const { data: drafts } = await supabase
      .from('events')
      .select(`
        *,
        host:profiles!host_id(*),
        category:categories!category_id(*)
      `)
      .eq('host_id', user.id)
      .eq('status', 'draft')
      .order('created_at', { ascending: false });

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

    setDraftEvents((drafts || []) as MyEvent[]);

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
        .filter((e: MyEvent) => ['active', 'full'].includes(e.status))
        .sort((a: MyEvent, b: MyEvent) =>
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        ) as MyEvent[]
    );

    setIsLoading(false);
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handlePublishDraft = async (eventId: string) => {
    setPendingActionId(eventId);
    const result = await publishDraft(eventId);
    setPendingActionId(null);
    if (result.success) {
      showToast('Event published!', 'success');
      fetchEvents();
    } else {
      showToast(result.error || 'Failed to publish draft', 'error');
    }
  };

  const handleDeleteDraft = async (eventId: string) => {
    if (!confirm('Delete this draft? This cannot be undone.')) return;
    setPendingActionId(eventId);
    const result = await deleteEvent(eventId);
    setPendingActionId(null);
    if (result.success) {
      showToast('Draft deleted', 'info');
      fetchEvents();
    } else {
      showToast(result.error || 'Failed to delete draft', 'error');
    }
  };

  const events =
    activeTab === 'hosting' ? hostingEvents :
    activeTab === 'joined' ? joinedEvents :
    draftEvents;
  const isEmpty = !isLoading && events.length === 0;

  return (
    <div className="min-h-screen bg-background pb-24 max-w-5xl mx-auto">
      <Header showLogo showCreateEvent showNotifications rightContent={<Link to="/settings" className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-background transition-colors" aria-label="Settings"><Settings className="h-5 w-5" /></Link>} />

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
        <button
          onClick={() => setActiveTab('drafts')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors relative',
            activeTab === 'drafts'
              ? 'text-coral'
              : 'text-text-muted hover:text-text'
          )}
        >
          Drafts
          {draftEvents.length > 0 && (
            <span className="ml-1.5 text-xs bg-coral/10 text-coral px-1.5 py-0.5 rounded-full">
              {draftEvents.length}
            </span>
          )}
          {activeTab === 'drafts' && (
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
              {activeTab === 'hosting' ? 'No events hosted' : activeTab === 'joined' ? 'No events joined' : 'No drafts'}
            </h2>
            <p className="text-text-muted text-center max-w-xs mb-6">
              {activeTab === 'hosting'
                ? 'Create an event to start connecting with others.'
                : activeTab === 'joined'
                ? "Browse events to find something you'd like to join."
                : 'Save an event as a draft to finish later.'}
            </p>
            <Link to={activeTab === 'joined' ? '/' : '/event/new'}>
              <GradientButton leftIcon={activeTab !== 'joined' ? <Plus className="h-4 w-4" /> : undefined}>
                {activeTab === 'joined' ? 'Browse Events' : 'Create Event'}
              </GradientButton>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTab === 'drafts'
              ? draftEvents.map((event) => (
                  <DraftRow
                    key={event.id}
                    event={event}
                    isPending={pendingActionId === event.id}
                    onPublish={() => handlePublishDraft(event.id)}
                    onDelete={() => handleDeleteDraft(event.id)}
                  />
                ))
              : (() => {
                  const now = new Date().toISOString();
                  const upcoming = events.filter((e) => (e.expires_at ?? e.start_time) >= now);
                  const past = events.filter((e) => (e.expires_at ?? e.start_time) < now);
                  return (
                    <>
                      {upcoming.length > 0 && (
                        <div className="space-y-3">
                          {upcoming.map((event) => (
                            <EventRow
                              key={event.id}
                              event={event}
                              showStatus={activeTab === 'joined'}
                            />
                          ))}
                        </div>
                      )}
                      {past.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Past</h3>
                          <div className="space-y-3">
                            {past.map((event) => (
                              <EventRow
                                key={event.id}
                                event={event}
                                showStatus={activeTab === 'joined'}
                                isPast
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
          </div>
        )}
      </div>
    </div>
  );
}
