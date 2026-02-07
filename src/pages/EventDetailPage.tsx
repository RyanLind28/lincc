import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout';
import { Avatar, Badge, GradientButton, CategoryIcon, Spinner } from '../components/ui';
import { MapPin, Clock, MessageCircle, Share2, ChevronRight, Users, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useEventParticipants } from '../hooks/useEventParticipants';
import { supabase } from '../lib/supabase';
import { calculateAge } from '../lib/utils';
import type { EventWithDetails } from '../types';

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
    start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
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

  const handleJoin = async () => {
    const result = await join();
    if (result.success) {
      if (event?.join_mode === 'auto') {
        showToast('You have joined the event!', 'success');
      } else {
        showToast('Join request sent!', 'success');
      }
    } else {
      showToast(result.error || 'Failed to join', 'error');
    }
  };

  const handleLeave = async () => {
    const result = await leave();
    if (result.success) {
      showToast('You have left the event', 'info');
    } else {
      showToast(result.error || 'Failed to leave', 'error');
    }
  };

  const handleShare = useCallback(async () => {
    if (!event) return;

    const shareUrl = `${window.location.origin}/event/${event.id}`;
    const shareData = {
      title: event.title,
      text: `Join me at ${event.title} on Lincc!`,
      url: shareUrl,
    };

    // Try Web Share API first (mobile)
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User cancelled or error - fall through to clipboard
        if ((err as Error).name === 'AbortError') return;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard!', 'success');
    } catch {
      showToast('Failed to copy link', 'error');
    }
  }, [event, showToast]);

  // Render join button based on status
  const renderJoinButton = () => {
    if (isHost) {
      return (
        <Link to={`/event/${id}/manage`} className="flex-1">
          <GradientButton fullWidth size="lg">
            <Users className="h-5 w-5 mr-2" />
            Manage Participants
            {pendingCount > 0 && (
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
                {pendingCount}
              </span>
            )}
          </GradientButton>
        </Link>
      );
    }

    if (userStatus === 'approved') {
      return (
        <>
          <button
            onClick={handleLeave}
            disabled={isJoining}
            className="px-4 py-3 rounded-xl border border-border text-text-muted hover:text-error hover:border-error transition-colors"
          >
            {isJoining ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Leave'}
          </button>
          <Link to={`/event/${id}/chat`} className="flex-1">
            <GradientButton fullWidth size="lg">
              <MessageCircle className="h-5 w-5 mr-2" />
              Open Chat
            </GradientButton>
          </Link>
        </>
      );
    }

    if (userStatus === 'pending') {
      return (
        <>
          <button
            onClick={handleLeave}
            disabled={isJoining}
            className="px-4 py-3 rounded-xl border border-border text-text-muted hover:text-error hover:border-error transition-colors"
          >
            {isJoining ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Cancel'}
          </button>
          <GradientButton fullWidth size="lg" disabled className="flex-1 opacity-70">
            <Clock className="h-5 w-5 mr-2" />
            Request Pending
          </GradientButton>
        </>
      );
    }

    if (userStatus === 'rejected') {
      return (
        <GradientButton fullWidth size="lg" disabled className="opacity-70">
          <X className="h-5 w-5 mr-2" />
          Request Declined
        </GradientButton>
      );
    }

    if (isFull) {
      return (
        <GradientButton fullWidth size="lg" disabled className="opacity-70">
          Event Full
        </GradientButton>
      );
    }

    return (
      <>
        <button
          className="p-3 rounded-xl border border-border text-text-muted hover:text-coral hover:border-coral transition-colors"
          aria-label="Message host"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
        <GradientButton
          fullWidth
          size="lg"
          onClick={handleJoin}
          isLoading={isJoining}
          className="flex-1"
        >
          {event?.join_mode === 'request' ? 'Request to Join' : 'Join Now'}
        </GradientButton>
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack />
        <div className="flex flex-col items-center justify-center p-8 mt-20">
          <h2 className="text-xl font-semibold text-text mb-2">Event not found</h2>
          <p className="text-text-muted text-center mb-4">
            This event may have been removed or doesn't exist.
          </p>
          <GradientButton onClick={() => navigate('/')}>Browse Events</GradientButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <Header
        showBack
        transparent
        rightContent={
          <button
            onClick={handleShare}
            className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-gray-100 transition-colors"
            aria-label="Share event"
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
              <CategoryIcon icon={event.category?.icon || 'Calendar'} size="md" className="text-white" />
            </div>
            <Badge variant="primary">{event.category?.name || 'Event'}</Badge>
            {event.audience === 'women' && (
              <Badge variant="secondary">Women only</Badge>
            )}
            {event.audience === 'men' && (
              <Badge variant="secondary">Men only</Badge>
            )}
            {isHost && <Badge variant="outline">Your Event</Badge>}
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
                  {event.venue_address} · {formatDistance(distanceKm)} away
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-text-light" />
            </div>
          </div>
        </div>

        {/* Host card - compact */}
        <Link
          to={`/user/${event.host.id}`}
          className="flex items-center gap-3 bg-surface rounded-2xl p-4 mb-4 group hover:bg-gray-50 transition-colors"
        >
          <Avatar
            src={event.host.avatar_url}
            name={event.host.first_name}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-muted uppercase tracking-wide">Hosted by</p>
            <h3 className="font-semibold text-text group-hover:text-coral transition-colors truncate">
              {event.host.first_name}{hostAge ? `, ${hostAge}` : ''}
            </h3>
          </div>
          <ChevronRight className="h-5 w-5 text-text-light group-hover:text-coral transition-colors flex-shrink-0" />
        </Link>

        {/* Participants card */}
        <div className="bg-surface rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
              Who's going
            </h2>
            <span className="text-sm text-text-muted">
              {approvedParticipants.length + 1}/{totalSpots}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
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

            {/* Approved Participants */}
            {approvedParticipants.map((participant) => (
              <Avatar
                key={participant.id}
                src={participant.user?.avatar_url}
                name={participant.user?.first_name || 'User'}
                size="md"
              />
            ))}

            {/* Empty spots */}
            {Array.from({ length: Math.max(0, spotsLeft) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-10 h-10 rounded-full border-2 border-dashed border-border flex items-center justify-center"
              >
                <span className="text-text-light text-lg">+</span>
              </div>
            ))}
          </div>

          {spotsLeft > 0 ? (
            <p className="text-sm text-coral font-medium mt-3">
              {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
            </p>
          ) : (
            <p className="text-sm text-text-muted font-medium mt-3">Event full</p>
          )}

          {/* User's status indicator */}
          {userStatus && (
            <div className="mt-3 pt-3 border-t border-border">
              {userStatus === 'approved' && (
                <p className="text-sm text-success flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  You're going to this event
                </p>
              )}
              {userStatus === 'pending' && (
                <p className="text-sm text-warning flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Your request is pending approval
                </p>
              )}
              {userStatus === 'rejected' && (
                <p className="text-sm text-error flex items-center gap-1">
                  <X className="h-4 w-4" />
                  Your request was declined
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface/95 backdrop-blur-sm border-t border-border safe-bottom">
        <div className="flex gap-3 max-w-lg mx-auto">
          {renderJoinButton()}
        </div>
      </div>
    </div>
  );
}
