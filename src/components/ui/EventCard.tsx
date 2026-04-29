import { Link } from 'react-router-dom';
import { Clock, MapPin, Bookmark, Users, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from './Avatar';
import { GradientButton } from './GradientButton';
import { CategoryIcon } from './CategoryIcon';
import { VerifiedTick } from '../business/VerifiedTick';

export interface EventCardEvent {
  id: string;
  title: string;
  cover_image_url?: string | null;
  category: {
    name: string;
    icon: string;
  };
  host: {
    first_name: string;
    age?: number;
    avatar_url?: string | null;
  };
  business?: {
    name: string;
    logo_url?: string | null;
    verified?: boolean;
  } | null;
  venue_name: string;
  distance_km?: number;
  start_time: string;
  capacity: number;
  participant_count: number;
  join_mode: 'instant' | 'request';
}

export interface EventCardProps {
  event: EventCardEvent;
  onJoin?: (eventId: string) => void;
  onToggleSave?: (eventId: string) => void;
  isSaved?: boolean;
  className?: string;
  variant?: 'default' | 'compact';
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 0) return 'Started';
  if (diffMins < 60) return `In ${diffMins} min`;
  if (diffMins < 120) return 'In 1 hr';
  if (diffMins < 1440) return `In ${Math.floor(diffMins / 60)} hrs`;
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDistance(km?: number): string {
  if (!km) return '';
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  return `${km.toFixed(1)} km away`;
}

// Capacity indicator dots
function CapacityDots({ capacity, filled }: { capacity: number; filled: number }) {
  const maxDots = Math.min(capacity + 1, 6); // +1 for host, max 6 dots
  const filledCount = Math.min(filled + 1, maxDots); // +1 for host

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxDots }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-2 h-2 rounded-full transition-colors',
            i < filledCount ? 'bg-coral' : 'bg-muted'
          )}
        />
      ))}
    </div>
  );
}

export function EventCard({
  event,
  onJoin,
  onToggleSave,
  isSaved = false,
  className,
  variant = 'default',
}: EventCardProps) {
  const spotsLeft = event.capacity - event.participant_count;

  return (
    <div
      className={cn(
        'bg-surface rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-all press-effect relative',
        className
      )}
    >
      {/* Bookmark button */}
      {onToggleSave && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSave(event.id);
          }}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-background transition-colors z-10"
          aria-label={isSaved ? 'Unsave event' : 'Save event'}
        >
          <Bookmark
            className={cn(
              'h-4 w-4 transition-colors',
              isSaved ? 'fill-coral text-coral animate-pop' : 'text-text-light'
            )}
          />
        </button>
      )}

      <Link to={`/event/${event.id}`} className="block">
        {/* Header: Icon + Title */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <CategoryIcon icon={event.category.icon} size="lg" className="text-white" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <span className="text-xs font-medium text-coral">{event.category.name}</span>
            <h3 className="font-semibold text-text truncate">{event.title}</h3>
          </div>
        </div>

        {/* Host info — business name takes precedence when the event is posted by a business */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar
            src={event.business?.logo_url ?? event.host.avatar_url}
            name={event.business?.name ?? event.host.first_name}
            size="sm"
          />
          <span className="text-sm text-text inline-flex items-center gap-1">
            {event.business ? (
              <>
                {event.business.name}
                {event.business.verified && <VerifiedTick size="xs" />}
              </>
            ) : (
              <>
                {event.host.first_name}
                {event.host.age && `, ${event.host.age}`}
              </>
            )}
          </span>
        </div>

        {/* Time & Distance */}
        <div className="flex items-center gap-4 text-sm text-text-muted mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatRelativeTime(event.start_time)}</span>
          </div>
          {event.distance_km !== undefined && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{formatDistance(event.distance_km)}</span>
            </div>
          )}
        </div>

        {/* Capacity */}
        <div className="flex items-center justify-between mb-3">
          <CapacityDots
            capacity={event.capacity}
            filled={event.participant_count}
          />
          <span className="text-xs text-text-muted">
            {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
          </span>
        </div>
      </Link>

      {/* CTA Button */}
      {variant === 'default' && (
        <GradientButton
          fullWidth
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            onJoin?.(event.id);
          }}
        >
          {event.join_mode === 'request' ? 'Request to Join' : 'Join'}
        </GradientButton>
      )}
    </div>
  );
}

// Compact list-row card used in profile tabs (Hosting / Joined / Saved / Past).
// Styled to match the ChatsPage row for visual consistency.
export function EventCardMini({ event, className }: { event: EventCardEvent; className?: string }) {
  const isPast = new Date(event.start_time).getTime() < Date.now();
  const totalSpots = event.capacity + 1; // +1 for host
  const filledSpots = Math.min(event.participant_count + 1, totalSpots);

  return (
    <Link
      to={`/event/${event.id}`}
      className={cn(
        'group flex items-center gap-3 p-3 bg-surface rounded-2xl border border-border hover:border-coral/50 hover:shadow-sm transition-all',
        isPast && 'opacity-75',
        className
      )}
    >
      {/* Cover image — large, prominent (matches chat row cover treatment) */}
      <div className="relative flex-shrink-0">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.title}
            loading="lazy"
            className="w-16 h-16 rounded-xl object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center">
            <CategoryIcon icon={event.category.icon} size="lg" className="text-white" />
          </div>
        )}
        {isPast && (
          <span className="absolute -top-1 -right-1 text-[9px] font-semibold text-white bg-black/70 px-1.5 py-0.5 rounded-full shadow-sm">
            Past
          </span>
        )}
      </div>

      {/* Title + meta row */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-text truncate group-hover:text-coral transition-colors">
          {event.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-text-muted mt-1 min-w-0">
          <span className="flex items-center gap-1 flex-shrink-0 text-coral font-medium">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(event.start_time)}
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
