import { NavLink, useLocation } from 'react-router-dom';
import { Map, List, MessageCircle, Calendar, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useViewMode } from '../../contexts/ViewModeContext';

// Wrapper component to apply gradient to icons
function GradientIcon({
  children,
  isActive,
  className
}: {
  children: React.ReactNode;
  isActive: boolean;
  className?: string;
}) {
  if (!isActive) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={cn('gradient-icon', className)}>
      {children}
    </span>
  );
}

export function BottomNav() {
  const location = useLocation();
  const { viewMode, toggleViewMode } = useViewMode();

  const isOnHomePage = location.pathname === '/';

  // Nav items - Discover is special, handled separately
  const navItems = [
    { to: '/chats', icon: MessageCircle, label: 'Chats' },
    { to: '/my-events', icon: Calendar, label: 'Events' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-sm border-t border-border safe-bottom">
      {/* SVG gradient definition */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="nav-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="100%" stopColor="#845EF7" />
          </linearGradient>
        </defs>
      </svg>

      <div className="flex items-center justify-around h-16">
        {/* Discover button - toggles map/list when on home, navigates when not */}
        {isOnHomePage ? (
          <button
            onClick={toggleViewMode}
            className="flex items-center justify-center p-3 rounded-xl transition-all"
            aria-label={viewMode === 'list' ? 'Switch to map view' : 'Switch to list view'}
          >
            <GradientIcon isActive={true}>
              {viewMode === 'list' ? (
                <Map className="h-6 w-6" strokeWidth={2.5} />
              ) : (
                <List className="h-6 w-6" strokeWidth={2.5} />
              )}
            </GradientIcon>
          </button>
        ) : (
          <NavLink
            to="/"
            className="flex items-center justify-center p-3 rounded-xl transition-all"
            aria-label="Discover"
          >
            <GradientIcon isActive={false} className="text-text-muted hover:text-text">
              <Map className="h-6 w-6" strokeWidth={2} />
            </GradientIcon>
          </NavLink>
        )}

        {/* Other nav items */}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex items-center justify-center p-3 rounded-xl transition-all"
            aria-label={item.label}
          >
            {({ isActive }) => (
              <GradientIcon isActive={isActive} className={!isActive ? 'text-text-muted hover:text-text' : ''}>
                <item.icon
                  className="h-6 w-6"
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </GradientIcon>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
