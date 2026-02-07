import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Settings, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';

// Lincc Logo component using the official brand logo
function LinccLogo({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const heights = {
    sm: 'h-7',
    md: 'h-8',
    lg: 'h-10',
  };

  return (
    <Link to="/" className={cn('flex items-center', className)}>
      <img
        src="https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp"
        alt="Lincc"
        className={heights[size]}
      />
    </Link>
  );
}

export interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  showSettings?: boolean;
  showLogo?: boolean;
  showCreateEvent?: boolean;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
  transparent?: boolean;
}

export function Header({
  title,
  showBack = false,
  showNotifications = false,
  showSettings = false,
  showLogo = false,
  showCreateEvent = false,
  leftContent,
  rightContent,
  className,
  transparent = false,
}: HeaderProps) {
  const navigate = useNavigate();
  const unreadCount = useUnreadNotificationCount();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 safe-top',
        transparent ? 'bg-transparent' : 'bg-surface/95 backdrop-blur-sm border-b border-border',
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left side */}
        <div className="flex items-center gap-2 min-w-[60px]">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl text-text-muted hover:text-text hover:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          {showCreateEvent && !showBack && (
            <Link
              to="/event/new"
              className="p-2 -ml-2 rounded-xl text-text-muted hover:text-coral hover:bg-coral/10 transition-colors"
              aria-label="Create event"
            >
              <Plus className="h-6 w-6" />
            </Link>
          )}
          {leftContent}
        </div>

        {/* Center - Logo or Title */}
        <div className="absolute left-1/2 -translate-x-1/2">
          {showLogo ? (
            <LinccLogo />
          ) : title ? (
            <h1 className="text-lg font-semibold text-text truncate">
              {title}
            </h1>
          ) : null}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 min-w-[60px] justify-end">
          {showNotifications && (
            <Link
              to="/notifications"
              className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-gray-100 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-error rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )}
          {showSettings && (
            <Link
              to="/settings"
              className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-gray-100 transition-colors"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </Link>
          )}
          {rightContent}
        </div>
      </div>
    </header>
  );
}

export { LinccLogo };
