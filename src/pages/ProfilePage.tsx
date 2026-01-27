import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout';
import { Avatar, Badge, GradientButton, EventCardMini, type EventCardEvent } from '../components/ui';
import { Edit2, Calendar, Users, Ghost, Lock } from 'lucide-react';
import { calculateAge } from '../lib/utils';

// Demo events for testing
const DEMO_HOSTING: EventCardEvent[] = [
  {
    id: '1',
    title: 'Morning Coffee Chat',
    category: { name: 'Coffee', icon: 'Coffee' },
    host: { first_name: 'You' },
    venue_name: 'Blue Bottle Coffee',
    start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    capacity: 2,
    participant_count: 1,
    join_mode: 'request',
  },
];

const DEMO_JOINED: EventCardEvent[] = [
  {
    id: '2',
    title: 'Park Yoga Session',
    category: { name: 'Yoga', icon: 'Heart' },
    host: { first_name: 'Emma', age: 32 },
    venue_name: 'Golden Gate Park',
    start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    capacity: 4,
    participant_count: 3,
    join_mode: 'instant',
  },
];

type EventTab = 'hosting' | 'joined';

export default function ProfilePage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<EventTab>('hosting');

  if (!profile) {
    return null;
  }

  const age = calculateAge(profile.dob);

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
            <span className="text-sm font-medium text-text">{DEMO_HOSTING.length} hosted</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-xl border border-border">
            <Users className="h-4 w-4 text-purple" />
            <span className="text-sm font-medium text-text">{DEMO_JOINED.length} joined</span>
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
          {activeTab === 'hosting' ? (
            DEMO_HOSTING.length > 0 ? (
              DEMO_HOSTING.map((event) => (
                <EventCardMini key={event.id} event={event} />
              ))
            ) : (
              <EmptyState
                title="No events yet"
                description="Create your first event and meet new people!"
                actionLabel="Create Event"
                actionHref="/event/new"
              />
            )
          ) : DEMO_JOINED.length > 0 ? (
            DEMO_JOINED.map((event) => (
              <EventCardMini key={event.id} event={event} />
            ))
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
