import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { GradientButton, CategoryIcon, Avatar, ChatListSkeleton } from '../components/ui';
import { MessageCircle, ChevronRight, Users, Loader2, Settings } from 'lucide-react';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useUserChats } from '../hooks/useEventChat';
import { useUserDMs } from '../hooks/useDMChat';
import { useAuth } from '../contexts/AuthContext';
import { useNow } from '../hooks/useNow';
import { formatRelativeTime } from '../lib/utils';
import { ChatStatusPill } from '../components/features/ChatStatusPill';

type ChatTab = 'events' | 'friends';

export default function ChatsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ChatTab>('events');
  const { chats, isLoading: eventsLoading, error: eventsError, refresh: refreshEvents } = useUserChats();
  const { conversations, isLoading: dmsLoading, error: dmsError, refresh: refreshDMs } = useUserDMs();
  const nowMs = useNow();

  const isLoading = activeTab === 'events' ? eventsLoading : dmsLoading;
  const error = activeTab === 'events' ? eventsError : dmsError;
  const refresh = activeTab === 'events' ? refreshEvents : refreshDMs;

  const handleRefresh = useCallback(async () => {
    refresh();
    await new Promise((r) => setTimeout(r, 600));
  }, [refresh]);
  const { pullDistance, isRefreshing, handlers: pullHandlers } = usePullToRefresh({ onRefresh: handleRefresh });

  const formatLastMessage = (content: string, senderId: string) => {
    const isMe = senderId === user?.id;
    const prefix = isMe ? 'You: ' : '';
    const maxLength = 40;
    const truncated =
      content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
    return prefix + truncated;
  };

  const renderTabButtons = () => (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => setActiveTab('events')}
        className={`flex-1 h-[var(--height-tap-target)] rounded-xl text-sm font-semibold transition-colors press-effect ${
          activeTab === 'events'
            ? 'gradient-primary text-white shadow-sm'
            : 'bg-surface border border-border text-text-muted hover:border-coral hover:text-coral'
        }`}
      >
        Events
      </button>
      <button
        onClick={() => setActiveTab('friends')}
        className={`flex-1 h-[var(--height-tap-target)] rounded-xl text-sm font-semibold transition-colors press-effect ${
          activeTab === 'friends'
            ? 'gradient-primary text-white shadow-sm'
            : 'bg-surface border border-border text-text-muted hover:border-coral hover:text-coral'
        }`}
      >
        Friends
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background max-w-5xl mx-auto">
        <Header showLogo showCreateEvent showNotifications rightContent={<Link to="/settings" className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-background transition-colors" aria-label="Settings"><Settings className="h-5 w-5" /></Link>} />
        <div className="p-4 lg:p-6">
          <h1 className="text-2xl font-bold text-text mb-4">Chats</h1>
          {renderTabButtons()}
          <ChatListSkeleton count={5} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background max-w-5xl mx-auto">
        <Header showLogo showCreateEvent showNotifications rightContent={<Link to="/settings" className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-background transition-colors" aria-label="Settings"><Settings className="h-5 w-5" /></Link>} />
        <div className="p-4 lg:p-6">
          <h1 className="text-2xl font-bold text-text mb-4">Chats</h1>
          {renderTabButtons()}
          <div className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-error" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-1">Something went wrong</h2>
            <p className="text-sm text-text-muted text-center mb-4">{error}</p>
            <GradientButton onClick={refresh}>Try Again</GradientButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-5xl mx-auto" {...pullHandlers}>
      <Header showLogo showCreateEvent showNotifications rightContent={<Link to="/settings" className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-background transition-colors" aria-label="Settings"><Settings className="h-5 w-5" /></Link>} />

      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="flex items-center justify-center transition-all duration-200 overflow-hidden"
          style={{ height: pullDistance > 0 ? pullDistance : isRefreshing ? 40 : 0 }}
        >
          <Loader2
            className={`h-5 w-5 text-coral ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ opacity: Math.min(pullDistance / 60, 1), transform: `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      )}

      <div className="p-4 lg:p-6">
        <h1 className="text-2xl font-bold text-text mb-4">Chats</h1>

        {renderTabButtons()}

        {/* Events tab */}
        {activeTab === 'events' && (
          <>
            {chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-text mb-2">No event chats yet</h2>
                <p className="text-text-muted text-center max-w-xs mb-6">
                  Join an event to start chatting with other participants.
                </p>
                <Link to="/">
                  <GradientButton>Browse Events</GradientButton>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {chats.map(({ event, lastMessage }) => {
                  const isHost = event.host_id === user?.id;
                  return (
                    <Link
                      key={event.id}
                      to={`/event/${event.id}/chat`}
                      className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border hover:border-coral/50 transition-colors group"
                    >
                      <div className="relative flex-shrink-0">
                        {event.cover_image_url ? (
                          <img
                            src={event.cover_image_url}
                            alt={event.title}
                            loading="lazy"
                            className="w-14 h-14 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center">
                            <CategoryIcon
                              icon={event.category?.icon || 'Calendar'}
                              size="md"
                              className="text-white"
                            />
                          </div>
                        )}
                        {isHost && (
                          <span className="absolute -bottom-1 -right-1 bg-coral text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full shadow-sm">
                            Host
                          </span>
                        )}
                      </div>
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
                        <div className="mt-1.5">
                          <ChatStatusPill
                            startTime={event.start_time}
                            expiresAt={event.expires_at}
                            nowMs={nowMs}
                          />
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-text-light group-hover:text-coral transition-colors flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Friends tab */}
        {activeTab === 'friends' && (
          <>
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-text mb-2">No messages yet</h2>
                <p className="text-text-muted text-center max-w-xs mb-4">
                  Share a voucher or event with a friend to start a conversation.
                </p>
                <Link to="/">
                  <GradientButton variant="outline">Browse Events</GradientButton>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((convo) => (
                  <Link
                    key={convo.id}
                    to={`/dm/${convo.id}`}
                    className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border hover:border-coral/50 transition-colors group"
                  >
                    <Avatar
                      src={convo.other_user.avatar_url}
                      name={convo.other_user.first_name}
                      size="lg"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-semibold text-text truncate group-hover:text-coral transition-colors">
                          {convo.other_user.first_name}
                        </h3>
                        {convo.last_message && (
                          <span className="text-xs text-text-light flex-shrink-0 ml-2">
                            {formatRelativeTime(convo.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-muted truncate">
                        {convo.last_message ? (
                          formatLastMessage(
                            convo.last_message.content,
                            convo.last_message.sender_id
                          )
                        ) : (
                          <span className="italic">No messages yet</span>
                        )}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-text-light group-hover:text-coral transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
