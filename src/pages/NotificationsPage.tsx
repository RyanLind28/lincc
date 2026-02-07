import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout';
import { GradientButton, Spinner } from '../components/ui';
import {
  Bell,
  UserPlus,
  CheckCircle,
  XCircle,
  MessageCircle,
  Clock,
  AlertCircle,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { getNotificationPath } from '../services/notificationService';
import { formatRelativeTime } from '../lib/utils';
import type { Notification, NotificationType } from '../types';

// Icon mapping for notification types
const notificationIcons: Record<NotificationType, React.ReactNode> = {
  join_request: <UserPlus className="h-5 w-5 text-coral" />,
  request_approved: <CheckCircle className="h-5 w-5 text-success" />,
  request_declined: <XCircle className="h-5 w-5 text-error" />,
  new_message: <MessageCircle className="h-5 w-5 text-purple" />,
  event_starting: <Clock className="h-5 w-5 text-warning" />,
  event_cancelled: <AlertCircle className="h-5 w-5 text-error" />,
};

// Background colors for notification types
const notificationBgColors: Record<NotificationType, string> = {
  join_request: 'bg-coral/10',
  request_approved: 'bg-success/10',
  request_declined: 'bg-error/10',
  new_message: 'bg-purple/10',
  event_starting: 'bg-warning/10',
  event_cancelled: 'bg-error/10',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markRead,
    markAllRead,
    deleteOne,
    refresh,
  } = useNotifications();

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      await markRead(notification.id);
    }
    // Navigate to the relevant page
    const path = getNotificationPath(notification);
    navigate(path);
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteOne(notificationId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Notifications" showBack />
        <div className="flex items-center justify-center p-8 mt-20">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Notifications" showBack />
        <div className="flex flex-col items-center justify-center p-8 mt-20">
          <p className="text-error mb-4">{error}</p>
          <GradientButton onClick={refresh}>Try Again</GradientButton>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Notifications" showBack />

        <div className="flex flex-col items-center justify-center p-8 mt-20">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">No notifications</h2>
          <p className="text-text-muted text-center max-w-xs">
            You're all caught up! Notifications about events and messages will appear here.
          </p>
        </div>
      </div>
    );
  }

  // Group notifications by date
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const groupedNotifications = notifications.reduce(
    (groups, notification) => {
      const date = new Date(notification.created_at).toDateString();
      let label: string;

      if (date === today) {
        label = 'Today';
      } else if (date === yesterday) {
        label = 'Yesterday';
      } else {
        label = new Date(notification.created_at).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(notification);
      return groups;
    },
    {} as Record<string, Notification[]>
  );

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header
        title="Notifications"
        showBack
        rightContent={
          unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="p-2 rounded-xl text-text-muted hover:text-coral hover:bg-coral/10 transition-colors"
              aria-label="Mark all as read"
            >
              <CheckCheck className="h-5 w-5" />
            </button>
          )
        }
      />

      <div className="p-4">
        {Object.entries(groupedNotifications).map(([dateLabel, dateNotifications]) => (
          <div key={dateLabel} className="mb-6">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
              {dateLabel}
            </h2>

            <div className="space-y-2">
              {dateNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-colors text-left ${
                    notification.is_read
                      ? 'bg-surface border-border hover:border-gray-300'
                      : 'bg-coral/5 border-coral/20 hover:border-coral/40'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      notificationBgColors[notification.type]
                    }`}
                  >
                    {notificationIcons[notification.type]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`font-medium ${
                          notification.is_read ? 'text-text' : 'text-text'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <span className="text-xs text-text-light flex-shrink-0">
                        {formatRelativeTime(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted mt-0.5 line-clamp-2">
                      {notification.body}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-coral rounded-full flex-shrink-0 mt-2" />
                  )}

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, notification.id)}
                    className="p-1 rounded-lg text-text-light hover:text-error hover:bg-error/10 transition-colors flex-shrink-0"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
