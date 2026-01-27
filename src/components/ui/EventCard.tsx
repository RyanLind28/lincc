import { Link } from 'react-router-dom';
import { Clock, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from './Avatar';
import { GradientButton } from './GradientButton';
import { CategoryIcon } from './CategoryIcon';

export interface EventCardEvent {
  id: string;
  title: string;
  category: {
    name: string;
    icon: string;
  };
  host: {
    first_name: string;
    age?: number;
    avatar_url?: string | null;
  };
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
            i < filledCount ? 'bg-coral' : 'bg-gray-200'
          )}
        />
      ))}
    </div>
  );
}

export function EventCard({
  event,
  onJoin,
  className,
  variant = 'default',
}: EventCardProps) {
  const spotsLeft = event.capacity - event.participant_count;

  return (
    <div
      className={cn(
        'bg-surface rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow',
        className
      )}
    >
      <Link to={`/event/${event.id}`} className="block">
        {/* Header: Icon + Title */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <CategoryIcon icon={event.category.icon} size="lg" className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-coral">{event.category.name}</span>
            <h3 className="font-semibold text-text truncate">{event.title}</h3>
          </div>
        </div>

        {/* Host info */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar
            src={event.host.avatar_url}
            name={event.host.first_name}
            size="sm"
          />
          <span className="text-sm text-text">
            {event.host.first_name}
            {event.host.age && `, ${event.host.age}`}
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

// Mini version for profile page
export function EventCardMini({ event, className }: { event: EventCardEvent; className?: string }) {
  return (
    <Link
      to={`/event/${event.id}`}
      className={cn(
        'flex items-center gap-3 p-3 bg-surface rounded-xl border border-border hover:border-coral transition-colors',
        className
      )}
    >
      <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
        <CategoryIcon icon={event.category.icon} size="md" className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-text text-sm truncate">{event.title}</h4>
        <p className="text-xs text-text-muted">{formatRelativeTime(event.start_time)}</p>
      </div>
    </Link>
  );
}
