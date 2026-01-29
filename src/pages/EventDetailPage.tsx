import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { Avatar, Badge, GradientButton, CategoryIcon } from '../components/ui';
import { MapPin, Clock, MessageCircle, Share2, ChevronRight } from 'lucide-react';

export default function EventDetailPage() {
  const { id } = useParams();

  // Placeholder data - will be fetched from Supabase
  const event = {
    id,
    title: 'Morning Coffee Chat',
    category: { name: 'Coffee', icon: 'Coffee' },
    host: {
      id: 'host-1',
      first_name: 'Sarah',
      age: 28,
      avatar_url: null,
      bio: 'Coffee enthusiast, always up for a good conversation!',
      tags: ['coffee', 'books', 'yoga'],
    },
    venue_name: 'Blue Bottle Coffee',
    venue_address: '123 Main St, San Francisco',
    distance_km: 0.5,
    start_time: '2026-02-01T10:00:00Z', // Placeholder - will be fetched from Supabase
    capacity: 2,
    participant_count: 1,
    participants: [
      { id: 'p1', first_name: 'Mike', avatar_url: null },
    ],
    join_mode: 'request',
    audience: 'everyone',
    description: 'Looking for someone to chat with over coffee! I come here every Tuesday morning to read and relax. Would love some company.',
  };

  const spotsLeft = event.capacity - event.participant_count;
  const totalSpots = event.capacity + 1; // +1 for host

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)} km`;
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <Header
        showBack
        transparent
        rightContent={
          <button
            className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-gray-100 transition-colors"
            aria-label="Share"
          >
            <Share2 className="h-5 w-5" />
          </button>
        }
      />

      {/* Map preview placeholder */}
      <div className="h-48 bg-gray-200 relative -mt-14">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center shadow-lg">
            <MapPin className="h-6 w-6 text-white" />
          </div>
        </div>
        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="px-4 -mt-6 relative">
        {/* Event header card */}
        <div className="bg-surface rounded-2xl shadow-lg p-5 mb-4">
          {/* Category badge */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <CategoryIcon icon={event.category.icon} size="md" className="text-white" />
            </div>
            <Badge variant="primary">{event.category.name}</Badge>
            {event.audience === 'women' && (
              <Badge variant="secondary">Women only</Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-text mb-4">{event.title}</h1>

          {/* Description */}
          {event.description && (
            <p className="text-text-muted mb-4">{event.description}</p>
          )}

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-text">
              <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 text-coral" />
              </div>
              <div>
                <p className="font-medium">{formatTime(event.start_time)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-text">
              <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center">
                <MapPin className="h-5 w-5 text-coral" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{event.venue_name}</p>
                <p className="text-sm text-text-muted">
                  {event.venue_address} · {formatDistance(event.distance_km)} away
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-text-light" />
            </div>
          </div>
        </div>

        {/* Host card */}
        <div className="bg-surface rounded-2xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-4">
            Hosted by
          </h2>
          <Link
            to={`/user/${event.host.id}`}
            className="flex items-center gap-4 group"
          >
            <Avatar
              src={event.host.avatar_url}
              name={event.host.first_name}
              size="xl"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-text text-lg group-hover:text-coral transition-colors">
                {event.host.first_name}, {event.host.age}
              </h3>
              {event.host.bio && (
                <p className="text-sm text-text-muted line-clamp-2 mb-2">
                  {event.host.bio}
                </p>
              )}
              {event.host.tags && (
                <div className="flex gap-1.5 flex-wrap">
                  {event.host.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-text-light group-hover:text-coral transition-colors" />
          </Link>
        </div>

        {/* Participants card */}
        <div className="bg-surface rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
              Who's going
            </h2>
            <span className="text-sm text-text-muted">
              {event.participant_count + 1}/{totalSpots}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Host */}
            <div className="relative">
              <Avatar
                src={event.host.avatar_url}
                name={event.host.first_name}
                size="md"
              />
              <span className="absolute -bottom-1 -right-1 bg-coral text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                Host
              </span>
            </div>

            {/* Participants */}
            {event.participants.map((participant) => (
              <Avatar
                key={participant.id}
                src={participant.avatar_url}
                name={participant.first_name}
                size="md"
              />
            ))}

            {/* Empty spots */}
            {Array.from({ length: spotsLeft }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-10 h-10 rounded-full border-2 border-dashed border-border flex items-center justify-center"
              >
                <span className="text-text-light text-lg">+</span>
              </div>
            ))}
          </div>

          {spotsLeft > 0 && (
            <p className="text-sm text-coral font-medium mt-3">
              {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
            </p>
          )}
        </div>
      </div>

      {/* Fixed bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface/95 backdrop-blur-sm border-t border-border safe-bottom">
        <div className="flex gap-3 max-w-lg mx-auto">
          <button
            className="p-3 rounded-xl border border-border text-text-muted hover:text-coral hover:border-coral transition-colors"
            aria-label="Message host"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
          <GradientButton fullWidth size="lg">
            {event.join_mode === 'request' ? 'Request to Join' : 'Join Now'}
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
