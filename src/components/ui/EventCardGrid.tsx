import { Link } from 'react-router-dom';
import { Clock, Bookmark } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from './Avatar';
import { CategoryIcon } from './CategoryIcon';
import { CATEGORIES } from '../../data/categories';

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
  business?: {
    name: string;
    logo_url?: string | null;
  } | null;
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

function CapacityDots({ filled, total }: { filled: number; total: number }) {
  const MAX_DOTS = 6;

  if (total <= MAX_DOTS) {
    // Show individual dots
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              i < filled ? 'bg-coral' : 'bg-gray-200'
            )}
          />
        ))}
      </div>
    );
  }

  // Larger capacity: 5 proportional dots + count
  const DOT_COUNT = 5;
  const filledDots = Math.round((filled / total) * DOT_COUNT);

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              i < filledDots ? 'bg-coral' : 'bg-gray-200'
            )}
          />
        ))}
      </div>
      <span className="text-[10px] text-text-muted">{filled}/{total}</span>
    </div>
  );
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
  const coverImage = event.cover_image || event.category.image || CATEGORIES.find(c => c.label === event.category.name)?.image;
  const showSpotsWarning = spotsLeft <= 2;

  return (
    <Link
      to={`/event/${event.id}`}
      className="flex flex-col bg-surface rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all press-effect group"
    >
      {/* Cover Image */}
      <div className="relative aspect-[4/3] bg-background overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={event.title}
            loading="lazy"
            width={400}
            height={300}
            decoding="async"
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
                isSaved ? 'fill-coral text-coral animate-pop' : 'text-text-muted'
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

      {/* Content — fixed height for uniformity */}
      <div className="p-3 flex flex-col h-[104px]">
        {/* Title — single line, truncate */}
        <h3 className="font-semibold text-text text-sm truncate mb-1.5">
          {event.title}
        </h3>

        {/* Time · Location — single line */}
        <div className="flex items-center gap-1 text-xs text-text-muted mb-2 min-w-0">
          <Clock className="h-3 w-3 text-coral-dark flex-shrink-0" />
          <span className="text-coral-dark font-medium flex-shrink-0">{formatRelativeTime(event.start_time)}</span>
          <span className="text-text-light flex-shrink-0">·</span>
          <span className="truncate">{event.venue_short || event.venue_name}</span>
        </div>

        {/* Host + Capacity — pushed to bottom */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
            <Avatar
              src={event.business?.logo_url ?? event.host.avatar_url}
              name={event.business?.name ?? event.host.first_name}
              size="xs"
            />
            <span className="text-xs text-text-muted truncate">{event.business?.name ?? event.host.first_name}</span>
          </div>
          <CapacityDots filled={event.participant_count + 1} total={event.capacity + 1} />
        </div>
      </div>
    </Link>
  );
}

export function EventCardGrid({ events, onToggleSave, savedIds, className }: EventCardGridProps) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4', className)}>
      {events.map((event, i) => (
        <div key={event.id} className="animate-stagger-item" style={i >= 7 ? { animationDelay: `${Math.min(i * 50, 350)}ms` } : undefined}>
          <EventCardTile
            event={event}
            onToggleSave={onToggleSave}
            isSaved={savedIds?.has(event.id)}
          />
        </div>
      ))}
    </div>
  );
}

export { EventCardTile };
