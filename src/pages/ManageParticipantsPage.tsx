import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { Avatar, GradientButton, Spinner } from '../components/ui';
import { Check, X, Clock, ChevronRight, Users, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useEventParticipants } from '../hooks/useEventParticipants';
import { supabase } from '../lib/supabase';
import { calculateAge } from '../lib/utils';
import type { EventWithDetails, ParticipantStatus } from '../types';

export default function ManageParticipantsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const { participants, isUpdating, approve, reject } = useEventParticipants(
    id,
    event?.join_mode || 'request'
  );

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          host:profiles!host_id(*),
          category:categories!category_id(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching event:', error);
        setIsLoading(false);
        return;
      }

      // Check if user is the host
      if (data.host_id !== user?.id) {
        showToast('You are not the host of this event', 'error');
        navigate(`/event/${id}`);
        return;
      }

      setEvent(data);
      setIsLoading(false);
    };

    fetchEvent();
  }, [id, user?.id, navigate, showToast]);

  const handleApprove = async (userId: string, userName: string) => {
    const result = await approve(userId);
    if (result.success) {
      showToast(`${userName} has been approved`, 'success');
    } else {
      showToast(result.error || 'Failed to approve', 'error');
    }
  };

  const handleReject = async (userId: string, userName: string) => {
    const result = await reject(userId);
    if (result.success) {
      showToast(`${userName} has been declined`, 'info');
    } else {
      showToast(result.error || 'Failed to decline', 'error');
    }
  };

  const pendingParticipants = participants.filter((p) => p.status === 'pending');
  const approvedParticipants = participants.filter((p) => p.status === 'approved');
  const rejectedParticipants = participants.filter((p) => p.status === 'rejected');

  const getTabCount = (status: ParticipantStatus) => {
    switch (status) {
      case 'pending':
        return pendingParticipants.length;
      case 'approved':
        return approvedParticipants.length;
      case 'rejected':
        return rejectedParticipants.length;
      default:
        return 0;
    }
  };

  const getCurrentParticipants = () => {
    switch (activeTab) {
      case 'pending':
        return pendingParticipants;
      case 'approved':
        return approvedParticipants;
      case 'rejected':
        return rejectedParticipants;
      default:
        return [];
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack title="Manage Participants" />
        <div className="flex flex-col items-center justify-center p-8 mt-20">
          <h2 className="text-xl font-semibold text-text mb-2">Event not found</h2>
          <GradientButton onClick={() => navigate('/')}>Go Home</GradientButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header showBack title="Manage Participants" />

      {/* Event summary */}
      <div className="p-4 border-b border-border">
        <Link to={`/event/${id}`} className="flex items-center gap-3 group">
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-text group-hover:text-coral transition-colors">
              {event.title}
            </h2>
            <p className="text-sm text-text-muted">
              {approvedParticipants.length}/{event.capacity} guests joined
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-text-light group-hover:text-coral transition-colors" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['pending', 'approved', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
              activeTab === tab
                ? 'text-coral'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <span className="capitalize">{tab}</span>
            {getTabCount(tab) > 0 && (
              <span
                className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab
                    ? 'bg-coral/20 text-coral'
                    : 'bg-gray-100 text-text-muted'
                }`}
              >
                {getTabCount(tab)}
              </span>
            )}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-coral" />
            )}
          </button>
        ))}
      </div>

      {/* Participant list */}
      <div className="p-4">
        {getCurrentParticipants().length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === 'pending' && <Clock className="h-8 w-8 text-text-light" />}
              {activeTab === 'approved' && <Check className="h-8 w-8 text-text-light" />}
              {activeTab === 'rejected' && <X className="h-8 w-8 text-text-light" />}
            </div>
            <p className="text-text-muted">
              {activeTab === 'pending' && 'No pending requests'}
              {activeTab === 'approved' && 'No approved guests yet'}
              {activeTab === 'rejected' && 'No declined requests'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {getCurrentParticipants().map((participant) => {
              const age = participant.user?.dob ? calculateAge(participant.user.dob) : null;
              return (
                <div
                  key={participant.id}
                  className="bg-surface rounded-xl p-4 border border-border"
                >
                  <div className="flex items-start gap-3">
                    <Link to={`/user/${participant.user_id}`}>
                      <Avatar
                        src={participant.user?.avatar_url}
                        name={participant.user?.first_name || 'User'}
                        size="lg"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/user/${participant.user_id}`}
                        className="font-semibold text-text hover:text-coral transition-colors"
                      >
                        {participant.user?.first_name}
                        {age && `, ${age}`}
                      </Link>
                      {participant.user?.bio && (
                        <p className="text-sm text-text-muted line-clamp-2 mt-1">
                          {participant.user.bio}
                        </p>
                      )}
                      {participant.user?.tags && participant.user.tags.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          {participant.user.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-text-muted"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-text-light mt-2">
                        Requested {new Date(participant.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {activeTab === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() =>
                          handleReject(participant.user_id, participant.user?.first_name || 'User')
                        }
                        disabled={isUpdating}
                        className="flex-1 py-2 px-4 rounded-xl border border-border text-text-muted hover:text-error hover:border-error transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Decline
                      </button>
                      <button
                        onClick={() =>
                          handleApprove(participant.user_id, participant.user?.first_name || 'User')
                        }
                        disabled={isUpdating}
                        className="flex-1 py-2 px-4 rounded-xl bg-coral text-white hover:bg-coral/90 transition-colors flex items-center justify-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                    </div>
                  )}

                  {activeTab === 'approved' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() =>
                          handleReject(participant.user_id, participant.user?.first_name || 'User')
                        }
                        disabled={isUpdating}
                        className="flex-1 py-2 px-4 rounded-xl border border-border text-text-muted hover:text-error hover:border-error transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </button>
                      <Link
                        to={`/event/${id}/chat`}
                        className="flex-1 py-2 px-4 rounded-xl border border-coral text-coral hover:bg-coral/10 transition-colors flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Chat
                      </Link>
                    </div>
                  )}

                  {activeTab === 'rejected' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() =>
                          handleApprove(participant.user_id, participant.user?.first_name || 'User')
                        }
                        disabled={isUpdating}
                        className="flex-1 py-2 px-4 rounded-xl bg-coral text-white hover:bg-coral/90 transition-colors flex items-center justify-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Approve Instead
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
