import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { Avatar, GradientButton, Input, Spinner } from '../components/ui';
import { Send, Lock, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEventChat } from '../hooks/useEventChat';
import { supabase } from '../lib/supabase';
import type { EventWithDetails } from '../types';

export default function ChatRoomPage() {
  const { id: _roomId } = useParams();
  const [message, setMessage] = useState('');
  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [eventLoading, setEventLoading] = useState(true);

  const { messages, isLoading, isSending, hasAccess, error, sendMessage } =
    useEventChat(eventId);

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

  if (isLoading || eventLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header showBack title={event?.title || 'Chat'} />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header showBack title="Chat" />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
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

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header with event link */}
      <Header
        showBack
        rightContent={
          event && (
            <Link
              to={`/event/${eventId}`}
              className="flex items-center gap-2 text-sm text-text-muted hover:text-coral transition-colors"
            >
              <span className="max-w-[120px] truncate">{event.title}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
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
              Send a message to the group!
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
                    const showName = showAvatar;

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Avatar (for others' messages) */}
                        {!isMe && (
                          <div className="w-8 flex-shrink-0">
                            {showAvatar && (
                              <Avatar
                                src={msg.sender?.avatar_url}
                                name={msg.sender?.first_name || 'User'}
                                size="sm"
                              />
                            )}
                          </div>
                        )}

                        {/* Message bubble */}
                        <div
                          className={`max-w-[75%] ${isMe ? 'order-first' : ''}`}
                        >
                          {showName && (
                            <p className="text-xs text-text-muted mb-1 ml-1">
                              {msg.sender?.first_name}
                            </p>
                          )}
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
      <div className="border-t border-border p-4 bg-surface safe-bottom">
        {error && (
          <p className="text-error text-sm mb-2 text-center">{error}</p>
        )}
        <div className="flex gap-2">
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
    </div>
  );
}
