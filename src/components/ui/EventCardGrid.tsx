import { Link } from 'react-router-dom';
import { Clock, Bookmark } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from './Avatar';
import { CategoryIcon } from './CategoryIcon';

export interface GridEventData {
  id: string;
  title: string;
  category: {
    name: string;
    icon: string;
    image?: string;
  };
  subcategory?: string;
  host: {
    first_name: string;
    avatar_url?: string | null;
  };
  venue_name: string;
  venue_short?: string; // e.g., "Shoreditch" or "Central London"
  distance_km?: number;
  start_time: string;
  capacity: number;
  participant_count: number;
  cover_image?: string;
}

export interface EventCardGridProps {
  events: GridEventData[];
  onEventClick?: (eventId: string) => void;
  onToggleSave?: (eventId: string) => void;
  savedIds?: Set<string>;
  className?: string;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 0) return 'Started';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function EventCardTile({
  event,
  onToggleSave,
  isSaved,
}: {
  event: GridEventData;
  onToggleSave?: (eventId: string) => void;
  isSaved?: boolean;
}) {
  const spotsLeft = event.capacity - event.participant_count;
  const coverImage = event.cover_image || event.category.image;
  const showSpotsWarning = spotsLeft <= 2;

  return (
    <Link
      to={`/event/${event.id}`}
      className="block bg-surface rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all group"
    >
      {/* Cover Image */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full gradient-primary flex items-center justify-center">
            <CategoryIcon icon={event.category.icon} size="xl" className="text-white" />
          </div>
        )}

        {/* Bookmark button */}
        {onToggleSave && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSave(event.id);
            }}
            className="absolute top-2 left-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-lg hover:bg-white transition-colors z-10"
            aria-label={isSaved ? 'Unsave event' : 'Save event'}
          >
            <Bookmark
              className={cn(
                'h-4 w-4 transition-colors',
                isSaved ? 'fill-coral text-coral' : 'text-text-muted'
              )}
            />
          </button>
        )}

        {/* Only show spots badge when 2 or fewer left */}
        {showSpotsWarning && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-coral text-white rounded-lg text-xs font-medium">
            {spotsLeft === 1 ? '1 spot left!' : `${spotsLeft} left`}
          </div>
        )}

        {/* Category pill at bottom of image */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-text flex items-center gap-1">
          <CategoryIcon icon={event.category.icon} size="sm" />
          <span>{event.subcategory || event.category.name}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <h3 className="font-semibold text-text text-sm line-clamp-2 mb-1.5">
          {event.title}
        </h3>

        {/* Time · Location on same line */}
        <div className="flex items-center gap-1 text-xs text-text-muted mb-2 truncate">
          <Clock className="h-3 w-3 text-coral flex-shrink-0" />
          <span className="text-coral font-medium">{formatRelativeTime(event.start_time)}</span>
          <span className="text-text-light">·</span>
          <span className="truncate">{event.venue_short || event.venue_name}</span>
        </div>

        {/* Host + Capacity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Avatar
              src={event.host.avatar_url}
              name={event.host.first_name}
              size="xs"
            />
            <span className="text-xs text-text-muted">{event.host.first_name}</span>
          </div>
          <span className="text-xs text-text-muted">
            {event.participant_count + 1}/{event.capacity + 1}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function EventCardGrid({ events, onToggleSave, savedIds, className }: EventCardGridProps) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4', className)}>
      {events.map((event) => (
        <EventCardTile
          key={event.id}
          event={event}
          onToggleSave={onToggleSave}
          isSaved={savedIds?.has(event.id)}
        />
      ))}
    </div>
  );
}

export { EventCardTile };
