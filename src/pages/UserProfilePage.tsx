import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout';
import { Avatar, Badge, GradientButton, CategoryIcon, Spinner, Button } from '../components/ui';
import { ReportDialog } from '../components/social/ReportDialog';
import { Calendar, Users, ChevronRight, Share2, Clock, MoreVertical, UserPlus, UserMinus, ShieldAlert, Ban } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { calculateAge } from '../lib/utils';
import { followUser, unfollowUser, isFollowing, getFollowerCount, getFollowingCount } from '../services/followService';
import { blockUser, unblockUser, isUserBlocked } from '../services/blockService';
import type { Profile, EventWithDetails } from '../types';

interface UserProfile extends Profile {
  events_hosted_count?: number;
  events_attended_count?: number;
}

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hostedEvents, setHostedEvents] = useState<EventWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Social state
  const [following, setFollowing] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

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

      // Fetch follow/block status and counts
      if (user && !isOwnProfile) {
        const [isFollowingResult, isBlockedResult] = await Promise.all([
          isFollowing(user.id, id),
          isUserBlocked(user.id, id),
        ]);
        setFollowing(isFollowingResult);
        setBlocked(isBlockedResult);
      }

      const [followers, followingCnt] = await Promise.all([
        getFollowerCount(id),
        getFollowingCount(id),
      ]);
      setFollowerCount(followers);
      setFollowingCount(followingCnt);

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
  }, [id, user, isOwnProfile]);

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

  const handleFollow = async () => {
    if (!user || !id) return;
    setSocialLoading(true);
    if (following) {
      const result = await unfollowUser(user.id, id);
      if (result.success) {
        setFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
      }
    } else {
      const result = await followUser(user.id, id);
      if (result.success) {
        setFollowing(true);
        setFollowerCount((c) => c + 1);
      }
    }
    setSocialLoading(false);
  };

  const handleBlock = async () => {
    if (!user || !id) return;
    setShowMenu(false);
    setSocialLoading(true);
    if (blocked) {
      const result = await unblockUser(user.id, id);
      if (result.success) {
        setBlocked(false);
        showToast('User unblocked', 'info');
      }
    } else {
      const result = await blockUser(user.id, id);
      if (result.success) {
        setBlocked(true);
        if (following) {
          await unfollowUser(user.id, id);
          setFollowing(false);
          setFollowerCount((c) => Math.max(0, c - 1));
        }
        showToast('User blocked', 'info');
      }
    }
    setSocialLoading(false);
  };

  const handleShare = useCallback(async () => {
    if (!profile) return;
    const shareUrl = `${window.location.origin}/user/${id}`;
    const shareData = {
      title: `${profile.first_name} on Lincc`,
      text: `Check out ${profile.first_name}'s profile on Lincc!`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Profile link copied!', 'success');
    } catch {
      showToast('Failed to copy link', 'error');
    }
  }, [profile, id, showToast]);

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
      <Header
        showBack
        title=""
        rightContent={
          !isOwnProfile ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleShare}
                className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-gray-100 transition-colors"
                aria-label="Share profile"
              >
                <Share2 className="h-5 w-5" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-gray-100 transition-colors"
                  aria-label="More options"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-surface rounded-xl border border-border shadow-lg z-50 overflow-hidden">
                      <button
                        onClick={handleBlock}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-text hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        <Ban className="h-4 w-4" />
                        {blocked ? 'Unblock user' : 'Block user'}
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowReport(true);
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-error hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        Report user
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : undefined
        }
      />

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
          <div className="flex justify-center gap-6 py-4 border-t border-b border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-coral">{followerCount}</p>
              <p className="text-xs text-text-muted uppercase tracking-wide">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-coral">{followingCount}</p>
              <p className="text-xs text-text-muted uppercase tracking-wide">Following</p>
            </div>
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
          <div className="mt-4 flex justify-center gap-3">
            {isOwnProfile ? (
              <Link to="/profile/edit">
                <GradientButton>Edit Profile</GradientButton>
              </Link>
            ) : (
              <>
                <Button
                  onClick={handleFollow}
                  variant={following ? 'outline' : 'primary'}
                  disabled={socialLoading || blocked}
                  leftIcon={following ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                >
                  {following ? 'Following' : 'Follow'}
                </Button>
              </>
            )}
          </div>

          {blocked && !isOwnProfile && (
            <p className="text-xs text-text-muted mt-3">You have blocked this user</p>
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

      {/* Report Dialog */}
      {id && profile && (
        <ReportDialog
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          reportedUserId={id}
          reportedUserName={profile.first_name}
        />
      )}
    </div>
  );
}
