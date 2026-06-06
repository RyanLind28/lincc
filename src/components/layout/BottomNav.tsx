import { NavLink, useLocation } from 'react-router-dom';
import { Compass, Map, Tag, MessageCircle, Calendar, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useViewMode } from '../../contexts/ViewModeContext';
import { useUnreadChats } from '../../hooks/useUnreadChats';

type NavSlotProps = {
  isActive: boolean;
  label: string;
  children: React.ReactNode;
  showDot?: boolean;
};

/**
 * A single bottom-nav slot. Pure solid-color state (coral active / muted inactive) —
 * way more reliable than the old SVG-gradient stroke trick which failed on some icons.
 * Shows a small label + an active dot for clear state feedback.
 */
function NavSlot({ isActive, label, children, showDot }: NavSlotProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 min-w-[56px]">
      <span
        className={cn(
          'relative flex items-center justify-center h-6 w-6 transition-colors',
          isActive ? 'text-coral' : 'text-text-muted'
        )}
      >
        {children}
        {showDot && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-error ring-2 ring-surface"
          />
        )}
      </span>
      <span
        className={cn(
          'text-[10px] font-semibold transition-colors leading-none',
          isActive ? 'text-coral-dark' : 'text-text-muted'
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function BottomNav() {
  const location = useLocation();
  const { viewMode, toggleViewMode } = useViewMode();
  const hasUnreadChats = useUnreadChats();

  const isOnHomePage = location.pathname === '/';
  // The Discover slot is "active" when we're on the home route regardless of list/map
  const discoverActive = isOnHomePage;

  const navItems = [
    { to: '/vouchers', icon: Tag, label: 'Vouchers', tourId: 'vouchers' },
    { to: '/chats', icon: MessageCircle, label: 'Chats', tourId: 'chats' },
    { to: '/my-events', icon: Calendar, label: 'Events', tourId: 'my-events' },
    { to: '/profile', icon: User, label: 'Profile', tourId: 'profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[var(--z-header)] bg-surface/95 backdrop-blur-sm border-t border-border safe-bottom lg:hidden" aria-label="Main navigation">
      <div className="flex items-stretch justify-around h-16">
        {/* Discover slot — on the home page it toggles map/list; elsewhere it navigates home */}
        {isOnHomePage ? (
          <button
            type="button"
            onClick={toggleViewMode}
            data-tour="discover"
            className="flex-1 flex items-center justify-center"
            aria-label="Discover"
          >
            <NavSlot isActive={discoverActive} label="Discover">
              {viewMode === 'list' ? (
                <Compass className="h-6 w-6" strokeWidth={2} />
              ) : (
                <Map className="h-6 w-6" strokeWidth={2} />
              )}
            </NavSlot>
          </button>
        ) : (
          <NavLink to="/" data-tour="discover" className="flex-1 flex items-center justify-center" aria-label="Discover">
            {({ isActive }) => (
              <NavSlot isActive={isActive} label="Discover">
                <Compass className="h-6 w-6" strokeWidth={2} />
              </NavSlot>
            )}
          </NavLink>
        )}

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            data-tour={item.tourId}
            className="flex-1 flex items-center justify-center"
            aria-label={item.label}
          >
            {({ isActive }) => (
              <NavSlot
                isActive={isActive}
                label={item.label}
                showDot={item.to === '/chats' && hasUnreadChats}
              >
                <item.icon className="h-6 w-6" strokeWidth={2} />
              </NavSlot>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
