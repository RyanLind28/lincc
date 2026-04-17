import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Bell, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';

// Lincc Logo — just the image. The Link wrapper lives in the Header so the whole
// center column is a clickable home-link (bigger tap target than the image alone).
function LinccLogo({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const heights = {
    sm: 'h-7',
    md: 'h-8',
    lg: 'h-10',
  };

  return (
    <img
      src="https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp"
      alt="Lincc"
      className={cn(heights[size], 'w-auto max-w-full object-contain', className)}
    />
  );
}

// Root tabs — these are the main navigation destinations, no back button needed
const ROOT_TABS = new Set(['/', '/chats', '/my-events', '/profile', '/explore']);

export interface HeaderProps {
  /** Optional title shown next to logo on desktop */
  title?: string;
  /** Override auto-detected back button */
  showBack?: boolean;
  /** Custom left content (replaces back button) */
  leftContent?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  // Legacy props — accepted but ignored for backwards compatibility
  showNotifications?: boolean;
  showSettings?: boolean;
  showLogo?: boolean;
  showCreateEvent?: boolean;
  transparent?: boolean;
  rightContent?: React.ReactNode;
}

export function Header({
  title,
  showBack,
  leftContent,
  rightContent,
  className,
}: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const unreadCount = useUnreadNotificationCount();

  // Auto-detect whether to show back button
  const isRootTab = ROOT_TABS.has(location.pathname);
  const shouldShowBack = showBack ?? !isRootTab;

  return (
    <>
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 safe-top bg-surface/95 backdrop-blur-sm border-b border-border lg:border-b-0',
        className
      )}
    >
      <div className="flex items-center h-14 px-4 gap-2">
        {/* Left side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {leftContent ? (
            leftContent
          ) : shouldShowBack ? (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl text-text-muted hover:text-text hover:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <Link
              to="/event/new"
              className="p-2 -ml-2 rounded-xl text-text-muted hover:text-coral hover:bg-coral/10 transition-colors lg:hidden"
              aria-label="Create event"
            >
              <Plus className="h-6 w-6" />
            </Link>
          )}
        </div>

        {/* Center — the whole column is the home-link tap target. flex-1 so it gives way
            when the right side is dense; overflow-hidden + max-w-full on the image keep
            things from spilling into the left/right columns. */}
        <Link
          to="/"
          aria-label="Go to home"
          className="flex-1 h-full flex items-center justify-center gap-2 min-w-0 overflow-hidden hover:opacity-80 transition-opacity"
        >
          <LinccLogo size={title ? 'sm' : 'md'} />
          {title && (
            <>
              <span className="text-sm font-semibold text-text-muted hidden sm:inline">|</span>
              <h1 className="text-base font-semibold text-text truncate max-w-[140px] sm:max-w-none hidden sm:block">
                {title}
              </h1>
            </>
          )}
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-1 flex-shrink-0 justify-end">
          {rightContent}
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
        </div>
      </div>
    </header>
    {/* Spacer to push content below fixed header */}
    <div className="h-14" />
    </>
  );
}

export { LinccLogo };
