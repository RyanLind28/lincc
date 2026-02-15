import { useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { Header } from '../components/layout';
import { EventCardGrid, GradientButton } from '../components/ui';
import { useBookmarks } from '../hooks/useBookmarks';

export default function SavedEventsPage() {
  const { savedEvents, savedIds, isLoading, loadSavedEvents, toggleSave } = useBookmarks();

  useEffect(() => {
    loadSavedEvents();
  }, [loadSavedEvents]);

  // Transform saved events to grid format
  const gridEvents = savedEvents.map((event) => ({
    id: event.id,
    title: event.title,
    category: {
      name: event.category?.name || 'Event',
      icon: event.category?.icon || 'Calendar',
    },
    host: {
      first_name: event.host?.first_name || 'Host',
      avatar_url: event.host?.avatar_url || null,
    },
    venue_name: event.venue_name,
    venue_short: event.venue_address?.split(',')[0] || event.venue_name,
    start_time: event.start_time,
    capacity: event.capacity,
    participant_count: event.participant_count || 0,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header showBack title="Saved Events" />

      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-surface rounded-2xl border border-border overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : gridEvents.length > 0 ? (
          <EventCardGrid
            events={gridEvents}
            onToggleSave={toggleSave}
            savedIds={savedIds}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Bookmark className="h-8 w-8 text-text-light" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-2">No saved events</h2>
            <p className="text-text-muted text-center text-sm mb-6 max-w-xs">
              Tap the bookmark icon on events you want to save for later.
            </p>
            <GradientButton onClick={() => (window.location.href = '/')}>
              Browse Events
            </GradientButton>
          </div>
        )}
      </div>
    </div>
  );
}
