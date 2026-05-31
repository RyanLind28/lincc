import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout';
import { Avatar, GradientButton, CategoryIcon, BottomSheet, EventDetailSkeleton, Input, TextArea } from '../components/ui';
import { MapPin, Clock, MessageCircle, Share2, ChevronRight, Users, Check, X, Loader2, Pencil, Trash2, AlertTriangle, Bookmark, MoreVertical, Ban, ShieldAlert, Navigation, Copy } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ReportDialog } from '../components/social/ReportDialog';
import { ShareEventSheet } from '../components/features/ShareEventSheet';
import { VerifiedTick } from '../components/business/VerifiedTick';
import { blockUser, isUserBlocked } from '../services/blockService';
import { useEventParticipants } from '../hooks/useEventParticipants';
import { hapticSuccess } from '../lib/haptics';
import { EventReviewsSection } from '../components/features/EventReviewsSection';
import { useBookmarks } from '../hooks/useBookmarks';
import { updateEvent, deleteEvent } from '../services/events';
import { getOrCreateConversation } from '../services/chat/dmService';
import { supabase } from '../lib/supabase';
import { cn, calculateAge, calculateDistance, getDisplayName } from '../lib/utils';
import { useUserLocation } from '../hooks/useUserLocation';
import type { EventWithDetails } from '../types';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { location: userLocation } = useUserLocation();

  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    participants,
    userStatus,
    pendingCount,
    isJoining,
    join,
    leave,
  } = useEventParticipants(id, event?.join_mode);

  const { isSaved, toggleSave } = useBookmarks();
  const eventSaved = id ? isSaved(id) : false;

  const isHost = user?.id === event?.host_id;
  const approvedParticipants = participants.filter(p => p.status === 'approved');
  const spotsLeft = event ? event.capacity - approvedParticipants.length : 0;
  const totalSpots = event ? event.capacity + 1 : 0; // +1 for host
  const isFull = spotsLeft <= 0;
  const hostAge = event?.host?.dob ? calculateAge(event.host.dob) : null;

  // Calculate distance from user to event
  const distanceKm = event && userLocation
    ? calculateDistance(userLocation.latitude, userLocation.longitude, event.venue_lat, event.venue_lng)
    : 0;

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;

      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('events')
        .select(`
          *,
          host:profiles!host_id(*),
          category:categories!category_id(*),
          business:businesses!business_id(*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) {
        setError(fetchError.message);
      } else if (data) {
        setEvent(data as EventWithDetails);
      }
      setIsLoading(false);
    };

    fetchEvent();
  }, [id]);

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
      hapticSuccess();
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

  const [showShareSheet, setShowShareSheet] = useState(false);

  // Social state (report/block)
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [hostBlocked, setHostBlocked] = useState(false);

  // Check if host is blocked
  useEffect(() => {
    if (user && event && !isHost) {
      isUserBlocked(user.id, event.host_id).then(setHostBlocked);
    }
  }, [user, event, isHost]);

  const handleBlockHost = async () => {
    if (!user || !event) return;
    setShowMoreMenu(false);
    const result = await blockUser(user.id, event.host_id);
    if (result.success) {
      setHostBlocked(true);
      showToast('User blocked', 'info');
    }
  };

  // Edit / Cancel state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editCapacity, setEditCapacity] = useState(1);

  const openEdit = () => {
    if (!event) return;
    setEditTitle(event.title);
    setEditDescription(event.description || '');
    setEditVenue(event.venue_name);
    setEditCapacity(event.capacity);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!event || !id) return;
    setIsSaving(true);

    const result = await updateEvent(id, {
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      venue_name: editVenue.trim(),
      capacity: editCapacity,
    });

    setIsSaving(false);

    if (result.success) {
      setEvent({
        ...event,
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        venue_name: editVenue.trim(),
        capacity: editCapacity,
      });
      setIsEditOpen(false);
      showToast('Event updated!', 'success');
    } else {
      showToast(result.error || 'Failed to update', 'error');
    }
  };

  const handleCancelEvent = async () => {
    if (!id) return;
    setIsSaving(true);

    const result = await deleteEvent(id);
    setIsSaving(false);

    if (result.success) {
      showToast('Event cancelled', 'info');
      navigate('/my-events');
    } else {
      showToast(result.error || 'Failed to cancel', 'error');
    }
  };

  const handleDuplicate = () => {
    if (!event) return;
    const categoryValue = CATEGORIES.find((c) => c.label === event.category?.name)?.value;
    const start = new Date(event.start_time);
    const hh = String(start.getHours()).padStart(2, '0');
    const mm = String(start.getMinutes()).padStart(2, '0');
    const draft = {
      step: 'details',
      categoryValue,
      customCategoryText: event.custom_category ?? '',
      title: event.title,
      description: event.description ?? '',
      venueName: event.venue_name,
      venueAddress: event.venue_address,
      venueLat: event.venue_lat,
      venueLng: event.venue_lng,
      venuePlaceId: event.venue_place_id,
      selectedDate: start.toISOString(),
      selectedTime: `${hh}:${mm}`,
      capacity: event.capacity,
      joinMode: event.join_mode,
      audience: event.audience,
      allowDms: event.allow_dms,
      coverImageUrl: event.cover_image_url,
    };
    try {
      sessionStorage.setItem('lincc-create-event-draft', JSON.stringify(draft));
    } catch { /* quota */ }
    showToast('Event details copied. Adjust and publish', 'success');
    navigate('/event/new');
  };

  const handleMessageHost = async () => {
    if (!user?.id || !event?.host_id || user.id === event.host_id) return;
    const result = await getOrCreateConversation(user.id, event.host_id);
    if (result.success && result.data) {
      navigate(`/dm/${result.data.id}`);
    } else {
      showToast('Failed to start conversation', 'error');
    }
  };

  // Render join button based on status
  const renderJoinButton = () => {
    if (isHost) {
      return (
        <>
          <Link to={`/event/${id}/chat`} className="flex-1 min-w-0">
            <GradientButton
              fullWidth
              size="lg"
              leftIcon={<MessageCircle className="h-5 w-5" />}
              className="whitespace-nowrap"
            >
              Chat
            </GradientButton>
          </Link>
          <Link to={`/event/${id}/manage`} className="flex-1 min-w-0">
            <GradientButton
              fullWidth
              size="lg"
              variant="secondary"
              leftIcon={<Users className="h-5 w-5" />}
              className="whitespace-nowrap"
            >
              Manage
              {pendingCount > 0 && (
                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                  {pendingCount}
                </span>
              )}
            </GradientButton>
          </Link>
        </>
      );
    }

    if (userStatus === 'approved') {
      return (
        <>
          <button
            onClick={handleLeave}
            disabled={isJoining}
            className="px-4 py-3 rounded-xl border border-border text-text-muted hover:text-error hover:border-error transition-colors text-sm"
          >
            {isJoining ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Leave'}
          </button>
          {event?.allow_dms !== false && (
            <button
              onClick={handleMessageHost}
              className="p-3 rounded-xl border border-border text-text-muted hover:text-coral hover:border-coral transition-colors"
              aria-label="Message host"
            >
              <MessageCircle className="h-6 w-6" />
            </button>
          )}
          <Link to={`/event/${id}/chat`} className="flex-1">
            <GradientButton fullWidth size="lg">
              <MessageCircle className="h-5 w-5 mr-2" />
              Group Chat
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
    return <EventDetailSkeleton />;
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack />
        <div className="flex flex-col items-center justify-center p-8 mt-20">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Event not found</h2>
          <p className="text-text-muted text-center mb-4 max-w-xs">
            This event may have been removed or doesn't exist.
          </p>
          <GradientButton onClick={() => navigate('/')}>Browse Events</GradientButton>
        </div>
      </div>
    );
  }

  return (
    // pb clears BOTH the bottom nav and the action bar stacked above it on
    // mobile; desktop has no nav so less padding is needed.
    <div className="min-h-screen bg-background pb-44 lg:pb-28 max-w-5xl mx-auto">
      {/* Header — global unified bar */}
      <Header showBack showLogo showCreateEvent showNotifications />

      <div className="px-4 lg:px-6 mt-2">
        {/* Event card with cover image */}
        <div className="bg-surface rounded-2xl shadow-lg overflow-hidden mb-4 lg:mb-6">
          {/* Cover image */}
          <div className="relative h-44 lg:h-64 bg-muted overflow-hidden">
            <img
              src={event.cover_image_url || CATEGORIES.find(c => c.label === event.category?.name)?.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=450&fit=crop'}
              alt={event.category?.name || 'Event'}
              className="w-full h-full object-cover"
              loading="eager"
            />
            {/* Action buttons overlaid on image */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              {isHost && (
                <>
                  <button
                    onClick={openEdit}
                    className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
                    aria-label="Edit event"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleDuplicate}
                    className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
                    aria-label="Duplicate event"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIsCancelOpen(true)}
                    className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
                    aria-label="Cancel event"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => id && toggleSave(id)}
                className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
                aria-label={eventSaved ? 'Unsave event' : 'Save event'}
              >
                <Bookmark className={cn('h-4 w-4', eventSaved && 'fill-coral text-coral')} />
              </button>
              <button
                onClick={() => setShowShareSheet(true)}
                className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
                aria-label="Share event"
              >
                <Share2 className="h-4 w-4" />
              </button>
              {!isHost && (
                <div className="relative">
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {showMoreMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-surface rounded-xl border border-border shadow-lg z-50 overflow-hidden">
                        <button
                          onClick={handleBlockHost}
                          className="w-full px-4 py-3 text-left text-sm font-medium text-text hover:bg-background flex items-center gap-3 transition-colors"
                        >
                          <Ban className="h-4 w-4" />
                          {hostBlocked ? 'Blocked' : 'Block host'}
                        </button>
                        <button
                          onClick={() => {
                            setShowMoreMenu(false);
                            setShowReportDialog(true);
                          }}
                          className="w-full px-4 py-3 text-left text-sm font-medium text-error hover:bg-background flex items-center gap-3 transition-colors"
                        >
                          <ShieldAlert className="h-4 w-4" />
                          Report event
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            {/* Category badge overlaid bottom-left */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
                <CategoryIcon icon={event.category?.icon || 'Calendar'} size="sm" className="text-white" />
                <span className="text-white text-sm font-medium">{event.category?.name || 'Event'}</span>
              </div>
              {event.audience === 'women' && (
                <span className="bg-purple/80 backdrop-blur-sm text-white text-xs font-medium rounded-full px-2.5 py-1">Women only</span>
              )}
              {event.audience === 'men' && (
                <span className="bg-purple/80 backdrop-blur-sm text-white text-xs font-medium rounded-full px-2.5 py-1">Men only</span>
              )}
              {isHost && (
                <span className="bg-coral/80 backdrop-blur-sm text-white text-xs font-medium rounded-full px-2.5 py-1">Your Event</span>
              )}
            </div>
          </div>

          {/* Event details inside card */}
          <div className="p-5">
            {/* Title */}
            <h1 className="text-2xl font-bold text-text mb-2">{event.title}</h1>

            {/* Description */}
            {event.description && (
              <p className="text-text-muted mb-4">{event.description}</p>
            )}

            {/* Time & Location — single line */}
            <div className="flex items-center gap-4 text-sm text-text-muted flex-wrap">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-coral" />
                {formatTime(event.start_time)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-coral" />
                {event.venue_name} · {formatDistance(distanceKm)}
              </span>
            </div>

            {/* Host — inside card. When the event is posted by a business, show the business identity. */}
            {event.business ? (
              <Link
                to={`/business/${event.business.slug || event.business.id}`}
                className="flex items-center gap-3 mt-4 pt-4 border-t border-border group"
              >
                <Avatar
                  src={event.business.logo_url}
                  name={event.business.name}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-muted">Hosted by</p>
                  <p className="font-medium text-text group-hover:text-coral transition-colors truncate inline-flex items-center gap-1">
                    {event.business.name}
                    {event.business.verified && <VerifiedTick size="sm" />}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-text-light group-hover:text-coral transition-colors flex-shrink-0" />
              </Link>
            ) : (
              <Link
                to={`/user/${event.host.id}`}
                className="flex items-center gap-3 mt-4 pt-4 border-t border-border group"
              >
                <Avatar
                  src={event.host.avatar_url}
                  name={getDisplayName(event.host)}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-muted">Hosted by</p>
                  <p className="font-medium text-text group-hover:text-coral transition-colors truncate">
                    {getDisplayName(event.host)}{hostAge ? `, ${hostAge}` : ''}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-text-light group-hover:text-coral transition-colors flex-shrink-0" />
              </Link>
            )}
          </div>
        </div>

        {/* Location & Map card */}
        <div className="bg-surface rounded-2xl shadow-lg p-5 mb-4 lg:mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-5 w-5 text-coral" />
            <h2 className="text-section-label">Location</h2>
          </div>

          <div className="h-36 lg:h-56 rounded-xl overflow-hidden mb-3">
            <img
              src={`https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+FF6B6B(${event.venue_lng},${event.venue_lat})/${event.venue_lng},${event.venue_lat},15,0/800x400@2x?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`}
              alt={`Map showing ${event.venue_name}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text">{event.venue_name}</p>
              <p className="text-sm text-text-muted truncate">{event.venue_address}</p>
            </div>
            <a
              href={(() => {
                // Universal Google Maps directions URL — works on web, iOS, and Android
                // (iOS/Android open the Google Maps app if installed, otherwise the web).
                const base = 'https://www.google.com/maps/dir/?api=1';
                const dest = event.venue_lat && event.venue_lng
                  ? `${event.venue_lat},${event.venue_lng}`
                  : event.venue_address || event.venue_name;
                const params = [`destination=${encodeURIComponent(dest)}`];
                if (event.venue_place_id) {
                  params.push(`destination_place_id=${event.venue_place_id}`);
                }
                return `${base}&${params.join('&')}`;
              })()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold text-coral hover:text-coral/80 transition-colors flex-shrink-0 ml-4"
            >
              <Navigation className="h-4 w-4" />
              Directions
            </a>
          </div>
        </div>

        {/* Participants card */}
        <div className="bg-surface rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-section-label">
              Who's going
            </h2>
            <span className="text-sm text-text-muted">
              {approvedParticipants.length + 1}/{totalSpots}
            </span>
          </div>

          {/* Host view: full guest list with names and profile links */}
          {isHost && (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Host */}
                <Link to={`/user/${event.host.id}`} className="relative">
                  <Avatar
                    src={event.host.avatar_url}
                    name={getDisplayName(event.host)}
                    size="md"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-coral text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                    Host
                  </span>
                </Link>

                {/* Approved Participants with names */}
                {approvedParticipants.map((participant) => (
                  <Link key={participant.id} to={`/user/${participant.user_id}`} className="flex flex-col items-center gap-1">
                    <Avatar
                      src={participant.user?.avatar_url}
                      name={getDisplayName(participant.user)}
                      size="md"
                    />
                    <span className="text-xs text-text-muted truncate max-w-[4rem]">
                      {getDisplayName(participant.user)}
                    </span>
                  </Link>
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
            </>
          )}

          {/* Participant view: avatar stack + count (no names) */}
          {!isHost && userStatus === 'approved' && (
            <div className="flex items-center gap-3">
              <div className="flex items-center -space-x-2">
                <div className="relative z-10">
                  <Avatar
                    src={event.host.avatar_url}
                    name={getDisplayName(event.host)}
                    size="sm"
                  />
                </div>
                {approvedParticipants.slice(0, 5).map((participant, idx) => (
                  <div key={participant.id} className="relative" style={{ zIndex: 9 - idx }}>
                    <Avatar
                      src={participant.user?.avatar_url}
                      name={getDisplayName(participant.user)}
                      size="sm"
                    />
                  </div>
                ))}
                {approvedParticipants.length > 5 && (
                  <div className="relative z-0 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center">
                    <span className="text-xs text-text-muted font-medium">+{approvedParticipants.length - 5}</span>
                  </div>
                )}
              </div>
              <span className="text-sm text-text-muted font-medium">
                {approvedParticipants.length + 1} going
              </span>
            </div>
          )}

          {/* Non-participant view: count only */}
          {!isHost && userStatus !== 'approved' && (
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-text-light" />
              <span className="text-sm text-text-muted font-medium">
                {approvedParticipants.length + 1} {approvedParticipants.length + 1 === 1 ? 'person' : 'people'} going
              </span>
            </div>
          )}

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

      {/* Reviews */}
      <div className="px-4">
        <EventReviewsSection
          eventId={event.id}
          hostId={event.host_id}
        />
      </div>

      {/* Action buttons — sticky bottom bar.
          MOBILE BUG FIX: this used z-sticky (20) at bottom-0, but the BottomNav
          (z-header = 30, also bottom-0, lg:hidden) rendered ON TOP of it, hiding
          the Join button entirely on phones. Now: on mobile sit ABOVE the nav
          (offset by the 64px nav height + safe-area) and use z-overlay (40) so
          it's never covered; on desktop the nav is hidden, so go flush to the
          bottom. */}
      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:bottom-0 left-0 right-0 lg:left-16 z-[var(--z-overlay)] bg-surface/95 backdrop-blur-sm border-t border-border px-4 py-3 lg:safe-bottom">
        <div className="max-w-5xl mx-auto flex gap-3">
          {renderJoinButton()}
        </div>
      </div>

      {/* Edit Event Bottom Sheet */}
      <BottomSheet
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Event"
      >
        <div className="space-y-4 pb-4">
          <Input
            label="Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            maxLength={60}
          />
          <TextArea
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            maxLength={280}
            rows={3}
            showCount
          />
          <Input
            label="Venue"
            value={editVenue}
            onChange={(e) => setEditVenue(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Capacity: {editCapacity} {editCapacity === 1 ? 'guest' : 'guests'}
            </label>
            <input
              type="range"
              min={1}
              max={15}
              value={editCapacity}
              onChange={(e) => setEditCapacity(Number(e.target.value))}
              className="w-full accent-coral"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsEditOpen(false)}
              className="flex-1 py-3 text-text-muted hover:text-text transition-colors font-medium"
            >
              Cancel
            </button>
            <GradientButton
              fullWidth
              onClick={handleSaveEdit}
              isLoading={isSaving}
              disabled={!editTitle.trim() || !editVenue.trim()}
              className="flex-1"
            >
              Save Changes
            </GradientButton>
          </div>
        </div>
      </BottomSheet>

      {/* Share Event Sheet */}
      {event && (
        <ShareEventSheet
          isOpen={showShareSheet}
          onClose={() => setShowShareSheet(false)}
          event={event}
        />
      )}

      {/* Report Dialog */}
      {event && (
        <ReportDialog
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          reportedUserId={event.host_id}
          reportedUserName={getDisplayName(event.host, 'Host')}
          eventId={event.id}
        />
      )}

      {/* Cancel Event Confirmation */}
      {isCancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-error" />
              </div>
              <h3 className="text-lg font-semibold text-text">Cancel Event?</h3>
            </div>
            <p className="text-text-muted text-sm mb-6">
              This will cancel the event and notify all participants. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsCancelOpen(false)}
                className="flex-1 py-3 rounded-xl border border-border text-text-muted hover:text-text font-medium transition-colors"
              >
                Keep Event
              </button>
              <button
                onClick={handleCancelEvent}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl bg-error text-white font-semibold hover:bg-error/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Cancel Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
