import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { Avatar, CategoryIcon, GradientButton, Input, Spinner } from '../components/ui';
import { Send, Lock, ChevronRight, MapPin, Clock, Flag } from 'lucide-react';
import { hapticLight } from '../lib/haptics';
import { useAuth } from '../contexts/AuthContext';
import { useEventChat } from '../hooks/useEventChat';
import { markChatsSeen } from '../hooks/useUnreadChats';
import { useNow } from '../hooks/useNow';
import { ChatStatusPill } from '../components/features/ChatStatusPill';
import { ReportMessageDialog } from '../components/social/ReportMessageDialog';
import { supabase } from '../lib/supabase';
import { getChatIdentity } from '../lib/utils';
import type { EventWithDetails } from '../types';

export default function ChatRoomPage() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [eventLoading, setEventLoading] = useState(true);

  // Opening a chat room counts as catching up — clear the bottom-nav dot.
  useEffect(() => { markChatsSeen(); }, []);

  const { messages, isLoading, isSending, hasAccess, error, sendMessage } =
    useEventChat(eventId);
  const nowMs = useNow();
  const [reportingMessage, setReportingMessage] = useState<{
    id: string;
    senderId: string;
    senderName: string;
    content: string;
  } | null>(null);

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;

      const { data } = await supabase
        .from('events')
        .select(`
          *,
          host:profiles!host_id(*),
          category:categories!category_id(*)
        `)
        .eq('id', eventId)
        .single();

      if (data) {
        setEvent(data as EventWithDetails);
      }
      setEventLoading(false);
    };

    fetchEvent();
  }, [eventId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    const result = await sendMessage(message);
    if (result.success) {
      hapticLight();
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce(
    (groups, msg) => {
      const date = new Date(msg.created_at).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
      return groups;
    },
    {} as Record<string, typeof messages>
  );

  // Chat lifecycle:
  //   - active up to event.expires_at (start + 2h)
  //   - read-only between expires_at and expires_at + 24h
  //   - archived (inaccessible) beyond expires_at + 24h -- enforced by RLS;
  //     the page just renders a clear empty-state instead of waiting on a
  //     silent zero-results response.
  const expiresAtMs = event ? new Date(event.expires_at).getTime() : 0;
  const archiveCutoffMs = expiresAtMs + 24 * 60 * 60 * 1000;
  const isPastEventEnd = !!event && nowMs > expiresAtMs;
  const isArchived = !!event && nowMs > archiveCutoffMs;

  if (isLoading || eventLoading) {
    return (
      <div className="h-dvh flex flex-col overflow-hidden bg-background max-w-3xl mx-auto">
        <Header showBack title={event?.title || 'Chat'} />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="h-dvh flex flex-col overflow-hidden bg-background max-w-3xl mx-auto">
        <Header showBack title="Chat" />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-text-light" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Access Denied</h2>
          <p className="text-text-muted text-center max-w-xs mb-6">
            You need to be an approved participant to access this chat.
          </p>
          <GradientButton onClick={() => navigate(`/event/${eventId}`)}>
            View Event
          </GradientButton>
        </div>
      </div>
    );
  }

  if (isArchived) {
    return (
      <div className="h-dvh flex flex-col overflow-hidden bg-background max-w-3xl mx-auto">
        <Header showBack title={event?.title || 'Chat'} />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-text-light" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Chat archived</h2>
          <p className="text-text-muted text-center max-w-xs mb-6">
            This event ended more than 24 hours ago, so its chat has been closed.
          </p>
          <GradientButton onClick={() => navigate(`/event/${eventId}`)}>
            View Event
          </GradientButton>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-background max-w-5xl mx-auto">
      {/* Header */}
      <Header showBack title="Chat" />

      {/* Event details banner */}
      {event && (
        <>
          <Link
            to={`/event/${eventId}`}
            className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-border hover:bg-background transition-colors"
          >
            <div className="h-10 w-10 gradient-primary rounded-xl flex items-center justify-center shrink-0">
              <CategoryIcon icon={event.category?.icon} size="sm" className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text text-sm truncate">{event.title}</p>
              <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                {event.venue_name && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {event.venue_name}
                  </span>
                )}
                <span className="flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3" />
                  {new Date(event.start_time).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
          </Link>

          {/* Lifecycle banner — upcoming / live / archive countdown */}
          <div className="flex items-center justify-center px-4 py-2 bg-background border-b border-border">
            <ChatStatusPill
              startTime={event.start_time}
              expiresAt={event.expires_at}
              nowMs={nowMs}
              variant="banner"
            />
          </div>
        </>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4" style={{ overscrollBehavior: 'contain' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center mb-4">
              <Send className="h-6 w-6 text-white" />
            </div>
            <p className="font-medium text-text mb-1">Start the conversation</p>
            <p className="text-sm text-text-muted">
              Send a message to the group!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center justify-center mb-4">
                  <span className="px-3 py-1 bg-background rounded-full text-xs text-text-muted">
                    {date}
                  </span>
                </div>

                {/* Messages for this date */}
                <div className="space-y-1">
                  {dateMessages.map((msg, index) => {
                    const isMe = msg.sender_id === user?.id;
                    const prevMsg = index > 0 ? dateMessages[index - 1] : null;
                    const sameSenderAsPrev = prevMsg?.sender_id === msg.sender_id;
                    const showAvatar = !isMe && !sameSenderAsPrev;
                    const showName = showAvatar;
                    const senderIdentity = getChatIdentity(msg.sender);

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${!sameSenderAsPrev && index > 0 ? 'mt-3' : ''}`}
                      >
                        {/* Avatar (for others' messages) — tap to visit profile */}
                        {!isMe && (
                          <div className="w-8 flex-shrink-0">
                            {showAvatar && (
                              <Link to={`/user/${msg.sender_id}`}>
                                <Avatar
                                  src={senderIdentity.avatarUrl}
                                  name={senderIdentity.name}
                                  size="sm"
                                />
                              </Link>
                            )}
                          </div>
                        )}

                        {/* Message bubble */}
                        <div
                          className={`max-w-[75%] ${isMe ? 'order-first' : ''}`}
                        >
                          {showName && (
                            <Link to={`/user/${msg.sender_id}`} className="hover:underline">
                              <p className="text-xs text-text-muted mb-1 ml-1">
                                {senderIdentity.name}
                              </p>
                            </Link>
                          )}
                          <div className="group relative">
                            <div
                              className={`px-4 py-2 rounded-2xl ${isMe
                                  ? 'gradient-primary text-white rounded-tr-sm'
                                  : 'bg-surface border border-border text-text rounded-tl-sm'
                                }`}
                            >
                              <p className="whitespace-pre-wrap break-words">
                                {msg.content}
                              </p>
                            </div>
                            {!isMe && (
                              <button
                                type="button"
                                onClick={() => setReportingMessage({
                                  id: msg.id,
                                  senderId: msg.sender_id,
                                  senderName: getChatIdentity(msg.sender, 'this user').name,
                                  content: msg.content,
                                })}
                                aria-label="Report message"
                                className="absolute -right-7 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface border border-border text-text-light hover:text-error hover:border-error/40 transition-colors flex items-center justify-center"
                              >
                                <Flag className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <p
                            className={`text-[10px] text-text-light mt-1 ${isMe ? 'text-right mr-1' : 'ml-1'
                              }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-surface">
        <div className="px-4 pt-3 pb-3">
          {error && (
            <p className="text-error text-sm mb-2 text-center">{error}</p>
          )}
          {isPastEventEnd && (
            <p className="text-xs text-text-muted text-center mb-2">
              This event has ended. The chat is read-only until it archives.
            </p>
          )}
          <div className="flex gap-2 items-end">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isPastEventEnd ? 'Event ended' : 'Type a message...'}
              className="flex-1"
              onKeyDown={handleKeyDown}
              disabled={isSending || isPastEventEnd}
            />
            <GradientButton
              onClick={handleSend}
              disabled={!message.trim() || isSending || isPastEventEnd}
              isLoading={isSending}
            >
              <Send className="h-4 w-4" />
            </GradientButton>
          </div>
        </div>
        {/* Safe area spacer for iOS home indicator */}
        <div className="safe-bottom" />
      </div>

      <ReportMessageDialog
        isOpen={!!reportingMessage}
        onClose={() => setReportingMessage(null)}
        reportedUserId={reportingMessage?.senderId ?? ''}
        reportedUserName={reportingMessage?.senderName ?? ''}
        messagePreview={reportingMessage?.content ?? ''}
        messageId={reportingMessage?.id}
        eventId={eventId}
      />
    </div>
  );
}
