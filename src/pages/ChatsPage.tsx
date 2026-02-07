import { Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { GradientButton, Spinner, CategoryIcon } from '../components/ui';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { useUserChats } from '../hooks/useEventChat';
import { useAuth } from '../contexts/AuthContext';
import { formatRelativeTime } from '../lib/utils';

export default function ChatsPage() {
  const { user } = useAuth();
  const { chats, isLoading, error, refresh } = useUserChats();

  const formatLastMessage = (content: string, senderId: string) => {
    const isMe = senderId === user?.id;
    const prefix = isMe ? 'You: ' : '';
    const maxLength = 40;
    const truncated =
      content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
    return prefix + truncated;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header showLogo showCreateEvent showNotifications />
        <div className="flex items-center justify-center p-8 mt-20">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header showLogo showCreateEvent showNotifications />
        <div className="flex flex-col items-center justify-center p-8 mt-20">
          <p className="text-error mb-4">{error}</p>
          <GradientButton onClick={refresh}>Try Again</GradientButton>
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header showLogo showCreateEvent showNotifications />

        <div className="flex flex-col items-center justify-center p-8 mt-20">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">No chats yet</h2>
          <p className="text-text-muted text-center max-w-xs mb-6">
            Join an event to start chatting with other participants.
          </p>
          <Link to="/">
            <GradientButton>Browse Events</GradientButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header showLogo showCreateEvent showNotifications />

      <div className="p-4">
        <h1 className="text-2xl font-bold text-text mb-4">Chats</h1>

        <div className="space-y-2">
          {chats.map(({ event, lastMessage }) => {
            const isHost = event.host_id === user?.id;
            return (
              <Link
                key={event.id}
                to={`/event/${event.id}/chat`}
                className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border hover:border-coral/50 transition-colors group"
              >
                {/* Event avatar/icon */}
                <div className="relative">
                  <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                    <CategoryIcon
                      icon={event.category?.icon || 'Calendar'}
                      size="md"
                      className="text-white"
                    />
                  </div>
                  {isHost && (
                    <span className="absolute -bottom-1 -right-1 bg-coral text-white text-[8px] font-medium px-1 py-0.5 rounded-full">
                      Host
                    </span>
                  )}
                </div>

                {/* Chat info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-semibold text-text truncate group-hover:text-coral transition-colors">
                      {event.title}
                    </h3>
                    {lastMessage && (
                      <span className="text-xs text-text-light flex-shrink-0 ml-2">
                        {formatRelativeTime(lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-muted truncate">
                    {lastMessage ? (
                      formatLastMessage(lastMessage.content, lastMessage.sender_id)
                    ) : (
                      <span className="italic">No messages yet</span>
                    )}
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 text-text-light group-hover:text-coral transition-colors flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
