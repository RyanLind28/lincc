import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { Avatar, GradientButton, Input, Spinner } from '../components/ui';
import { Send, Ticket, Calendar, ChevronRight, Clock, MapPin, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDMChat } from '../hooks/useDMChat';
import { supabase } from '../lib/supabase';
import type { Profile, DirectMessageWithSender } from '../types';

export default function DMChatRoomPage() {
  const { id: conversationId } = useParams();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [otherUserLoading, setOtherUserLoading] = useState(true);

  const { messages, isLoading, isSending, error, sendMessage } =
    useDMChat(conversationId);

  // Fetch conversation + other user details
  useEffect(() => {
    const fetchConversation = async () => {
      if (!conversationId || !user?.id) return;

      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (data) {
        const otherUserId =
          data.participant_one === user.id ? data.participant_two : data.participant_one;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherUserId)
          .single();

        if (profile) {
          setOtherUser(profile as Profile);
        }
      }
      setOtherUserLoading(false);
    };

    fetchConversation();
  }, [conversationId, user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    const result = await sendMessage(message);
    if (result.success) {
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
    {} as Record<string, DirectMessageWithSender[]>
  );

  if (isLoading || otherUserLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header showBack title="Chat" />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header with user info */}
      <Header
        showBack
        leftContent={
          otherUser ? (
            <Link to={`/user/${otherUser.id}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <Avatar
                src={otherUser.avatar_url}
                name={otherUser.first_name}
                size="sm"
              />
              <span className="font-semibold text-text text-sm">{otherUser.first_name}</span>
            </Link>
          ) : (
            <span className="text-sm font-semibold text-text">Chat</span>
          )
        }
      />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center mb-4">
              <Send className="h-6 w-6 text-white" />
            </div>
            <p className="font-medium text-text mb-1">Start the conversation</p>
            <p className="text-sm text-text-muted">
              Send a message to {otherUser?.first_name || 'your friend'}!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center justify-center mb-4">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-text-muted">
                    {date}
                  </span>
                </div>

                {/* Messages for this date */}
                <div className="space-y-3">
                  {dateMessages.map((msg, index) => {
                    const isMe = msg.sender_id === user?.id;
                    const showAvatar =
                      !isMe &&
                      (index === 0 ||
                        dateMessages[index - 1].sender_id !== msg.sender_id);

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Avatar (for other user's messages) */}
                        {!isMe && (
                          <div className="w-8 flex-shrink-0">
                            {showAvatar && (
                              <Link to={`/user/${msg.sender_id}`}>
                                <Avatar
                                  src={msg.sender?.avatar_url}
                                  name={msg.sender?.first_name || 'User'}
                                  size="sm"
                                />
                              </Link>
                            )}
                          </div>
                        )}

                        {/* Message bubble */}
                        <div className={`max-w-[75%] ${isMe ? 'order-first' : ''}`}>
                          {/* Special rendering for share cards */}
                          {msg.message_type === 'voucher_share' ? (
                            <VoucherShareCard msg={msg} />
                          ) : msg.message_type === 'event_share' ? (
                            <EventShareCard msg={msg} />
                          ) : (
                            <div
                              className={`px-4 py-2 rounded-2xl ${
                                isMe
                                  ? 'gradient-primary text-white rounded-tr-sm'
                                  : 'bg-surface border border-border text-text rounded-tl-sm'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">
                                {msg.content}
                              </p>
                            </div>
                          )}
                          <p
                            className={`text-[10px] text-text-light mt-1 ${
                              isMe ? 'text-right mr-1' : 'ml-1'
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
          <div className="flex gap-2 items-end">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              onKeyDown={handleKeyDown}
              disabled={isSending}
            />
            <GradientButton
              onClick={handleSend}
              disabled={!message.trim() || isSending}
              isLoading={isSending}
            >
              <Send className="h-4 w-4" />
            </GradientButton>
          </div>
        </div>
        {/* Safe area spacer for iOS home indicator */}
        <div className="safe-bottom" />
      </div>
    </div>
  );
}

// ── Share Card Components ─────────────────────────────────────────

function VoucherShareCard({ msg }: { msg: DirectMessageWithSender }) {
  const voucherId = msg.metadata?.voucher_id as string | undefined;

  // Parse content: "DISCOUNT - Title at Venue"
  const parts = msg.content.split(' - ');
  const discount = parts.length > 1 ? parts[0] : '';
  const description = parts.length > 1 ? parts.slice(1).join(' - ') : msg.content;

  return (
    <Link
      to={voucherId ? `/voucher/${voucherId}` : '#'}
      className="block rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Gradient header with ticket icon */}
      <div className="bg-gradient-to-r from-coral to-purple px-4 py-2.5 flex items-center gap-2">
        <Ticket className="h-4 w-4 text-white/80" />
        <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">Voucher</span>
      </div>
      {/* Card body */}
      <div className="px-4 py-3 bg-surface border border-t-0 border-border rounded-b-2xl">
        {discount && (
          <span className="inline-block px-2.5 py-0.5 bg-coral/10 text-coral text-xs font-bold rounded-md mb-2 uppercase">
            {discount}
          </span>
        )}
        <p className="text-sm font-medium leading-snug text-text">
          {description}
        </p>
        <div className="flex items-center gap-1 mt-2 text-coral">
          <span className="text-xs font-medium">View voucher</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}

interface EventCardData {
  title: string;
  venue_name: string;
  start_time: string;
  capacity: number;
  participant_count: number;
  category: { name: string; icon: string } | null;
}

function formatEventTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 0) return 'Started';
  if (diffMins < 60) return `In ${diffMins}m`;
  if (diffHours < 24) return `In ${diffHours}h`;

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function EventShareCard({ msg }: { msg: DirectMessageWithSender }) {
  const eventId = msg.metadata?.event_id as string | undefined;
  const [event, setEvent] = useState<EventCardData | null>(null);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    supabase
      .from('events')
      .select(`
        title, venue_name, start_time, capacity,
        participant_count:event_participants(count),
        category:categories!category_id(name, icon)
      `)
      .eq('id', eventId)
      .single()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setEvent({
          title: data.title,
          venue_name: data.venue_name,
          start_time: data.start_time,
          capacity: data.capacity,
          participant_count: (data.participant_count as any)?.[0]?.count || 0,
          category: data.category as any,
        });
      });

    return () => { cancelled = true; };
  }, [eventId]);

  // Fallback: parse from content if fetch hasn't loaded
  const fallbackCleaned = msg.content
    .replace(/^Check out this event:\s*/i, '')
    .replace(/!$/, '');

  const title = event?.title || fallbackCleaned;
  const spotsLeft = event ? event.capacity - event.participant_count : null;

  return (
    <Link
      to={eventId ? `/event/${eventId}` : '#'}
      className="block rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-purple to-blue px-4 py-2.5 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-white/80" />
        <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">Event</span>
      </div>
      {/* Card body */}
      <div className="px-4 py-3 bg-surface border border-t-0 border-border rounded-b-2xl">
        <p className="text-sm font-semibold leading-snug text-text">
          {title}
        </p>

        {event && (
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <MapPin className="h-3 w-3 text-text-light flex-shrink-0" />
              <span className="truncate">{event.venue_name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Clock className="h-3 w-3 text-text-light flex-shrink-0" />
              <span>{formatEventTime(event.start_time)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Users className="h-3 w-3 text-text-light flex-shrink-0" />
              <span>
                {event.participant_count + 1}/{event.capacity + 1} going
                {spotsLeft !== null && spotsLeft <= 3 && (
                  <span className="text-coral font-medium"> · {spotsLeft === 0 ? 'Full' : `${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} left`}</span>
                )}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 mt-2.5 text-purple">
          <span className="text-xs font-medium">View event</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}
