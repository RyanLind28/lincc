import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout';
import { Avatar, Badge, GradientButton, CategoryIcon, Spinner } from '../components/ui';
import { Calendar, Users, ChevronRight, MessageCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { calculateAge } from '../lib/utils';
import type { Profile, EventWithDetails } from '../types';

interface UserProfile extends Profile {
  events_hosted_count?: number;
  events_attended_count?: number;
}

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hostedEvents, setHostedEvents] = useState<EventWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = user?.id === id;

  // Fetch user profile and their hosted events
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError || !profileData) {
        console.error('Error fetching profile:', profileError);
        setError('User not found');
        setIsLoading(false);
        return;
      }

      // Fetch hosted events count
      const { count: hostedCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('host_id', id);

      // Fetch attended events count
      const { count: attendedCount } = await supabase
        .from('event_participants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id)
        .eq('status', 'approved');

      setProfile({
        ...profileData,
        events_hosted_count: hostedCount || 0,
        events_attended_count: attendedCount || 0,
      });

      // Fetch user's upcoming hosted events (limit 3)
      const { data: eventsData } = await supabase
        .from('events')
        .select(`
          *,
          host:profiles!host_id(*),
          category:categories!category_id(*),
          participant_count:event_participants(count)
        `)
        .eq('host_id', id)
        .eq('status', 'active')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(3);

      if (eventsData) {
        setHostedEvents(
          eventsData.map((e) => ({
            ...e,
            participant_count: e.participant_count?.[0]?.count || 0,
          }))
        );
      }

      setIsLoading(false);
    };

    fetchUserData();
  }, [id]);

  const age = profile?.dob ? calculateAge(profile.dob) : null;

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack />
        <div className="flex flex-col items-center justify-center p-8 mt-20">
          <h2 className="text-xl font-semibold text-text mb-2">User not found</h2>
          <p className="text-text-muted text-center mb-4">
            This profile may have been removed or doesn't exist.
          </p>
          <GradientButton onClick={() => navigate('/')}>Go Home</GradientButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header showBack title="" />

      {/* Profile Header */}
      <div className="px-4 pt-4">
        <div className="bg-surface rounded-2xl p-6 text-center mb-4">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <Avatar
              src={profile.avatar_url}
              name={profile.first_name}
              size="xl"
            />
          </div>

          {/* Name and Age */}
          <h1 className="text-2xl font-bold text-text mb-1">
            {profile.first_name}{age ? `, ${age}` : ''}
          </h1>

          {/* Bio */}
          {profile.bio && (
            <p className="text-text-muted text-sm mb-4 max-w-xs mx-auto">
              {profile.bio}
            </p>
          )}

          {/* Stats */}
          <div className="flex justify-center gap-8 py-4 border-t border-b border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-coral">{profile.events_hosted_count || 0}</p>
              <p className="text-xs text-text-muted uppercase tracking-wide">Hosted</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-coral">{profile.events_attended_count || 0}</p>
              <p className="text-xs text-text-muted uppercase tracking-wide">Attended</p>
            </div>
          </div>

          {/* Tags/Interests */}
          {profile.tags && profile.tags.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Interests</p>
              <div className="flex flex-wrap justify-center gap-2">
                {profile.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isOwnProfile ? (
            <Link to="/profile/edit" className="mt-4 inline-block">
              <GradientButton>Edit Profile</GradientButton>
            </Link>
          ) : (
            <button
              className="mt-4 px-6 py-2 rounded-xl border border-coral text-coral hover:bg-coral/5 transition-colors inline-flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Message
            </button>
          )}
        </div>

        {/* Upcoming Events Section */}
        {hostedEvents.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-text">
                {isOwnProfile ? 'Your Upcoming Events' : 'Upcoming Events'}
              </h2>
              {(profile.events_hosted_count || 0) > 3 && (
                <button className="text-coral text-sm font-medium">View All</button>
              )}
            </div>

            <div className="space-y-3">
              {hostedEvents.map((event) => (
                <Link
                  key={event.id}
                  to={`/event/${event.id}`}
                  className="flex items-center gap-3 bg-surface rounded-xl p-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                    <CategoryIcon
                      icon={event.category?.icon || 'Calendar'}
                      size="md"
                      className="text-white"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-text group-hover:text-coral transition-colors truncate">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="truncate">{formatEventTime(event.start_time)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-text-muted text-sm">
                    <Users className="h-4 w-4" />
                    <span>{event.participant_count}/{event.capacity + 1}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-text-light group-hover:text-coral transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State for Hosted Events */}
        {hostedEvents.length === 0 && (
          <div className="bg-surface rounded-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-8 w-8 text-text-muted" />
            </div>
            <p className="text-text-muted mb-4">
              {isOwnProfile
                ? "You haven't hosted any events yet"
                : `${profile.first_name} hasn't hosted any events yet`}
            </p>
            {isOwnProfile && (
              <Link to="/event/new">
                <GradientButton>Host Your First Event</GradientButton>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
