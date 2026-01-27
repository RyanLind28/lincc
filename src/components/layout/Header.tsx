import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Settings, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

// Lincc Logo component with gradient branding
function LinccLogo({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { svg: 24, text: 'text-lg' },
    md: { svg: 28, text: 'text-xl' },
    lg: { svg: 32, text: 'text-2xl' },
  };

  return (
    <Link to="/" className={cn('flex items-center gap-1', className)}>
      {/* Icon: Two interlocking circles */}
      <svg
        width={sizes[size].svg}
        height={sizes[size].svg}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="lincc-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="100%" stopColor="#845EF7" />
          </linearGradient>
        </defs>
        {/* Left circle */}
        <circle cx="10" cy="14" r="7" stroke="url(#lincc-gradient)" strokeWidth="2.5" fill="none" />
        {/* Right circle */}
        <circle cx="18" cy="14" r="7" stroke="url(#lincc-gradient)" strokeWidth="2.5" fill="none" />
      </svg>
      {/* Wordmark */}
      <span className={cn('font-bold gradient-text', sizes[size].text)}>Lincc</span>
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
              {/* Notification badge - uncomment when implementing notifications */}
              {/* <span className="absolute top-1 right-1 h-2 w-2 bg-error rounded-full" /> */}
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
