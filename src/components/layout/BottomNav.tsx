import { NavLink, useLocation } from 'react-router-dom';
import { Compass, Map, List, Tag, MessageCircle, Calendar, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useViewMode } from '../../contexts/ViewModeContext';

type NavSlotProps = {
  isActive: boolean;
  label: string;
  children: React.ReactNode;
};

/**
 * A single bottom-nav slot. Pure solid-color state (coral active / muted inactive) —
 * way more reliable than the old SVG-gradient stroke trick which failed on some icons.
 * Shows a small label + an active dot for clear state feedback.
 */
function NavSlot({ isActive, label, children }: NavSlotProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 min-w-[56px]">
      <span
        className={cn(
          'flex items-center justify-center h-6 w-6 transition-colors',
          isActive ? 'text-coral' : 'text-text-muted'
        )}
      >
        {children}
      </span>
      <span
        className={cn(
          'text-[10px] font-medium transition-colors leading-none',
          isActive ? 'text-coral' : 'text-text-muted'
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

  const isOnHomePage = location.pathname === '/';
  // The Discover slot is "active" when we're on the home route regardless of list/map
  const discoverActive = isOnHomePage;

  const navItems = [
    { to: '/vouchers', icon: Tag, label: 'Vouchers' },
    { to: '/chats', icon: MessageCircle, label: 'Chats' },
    { to: '/my-events', icon: Calendar, label: 'Events' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm border-t border-border safe-bottom lg:hidden">
      <div className="flex items-stretch justify-around h-16">
        {/* Discover slot — on the home page it toggles map/list; elsewhere it navigates home */}
        {isOnHomePage ? (
          <button
            type="button"
            onClick={toggleViewMode}
            className="flex-1 flex items-center justify-center"
            aria-label={viewMode === 'list' ? 'Switch to map view' : 'Switch to list view'}
          >
            <NavSlot isActive={discoverActive} label={viewMode === 'list' ? 'Map' : 'List'}>
              {viewMode === 'list' ? (
                <Map className="h-6 w-6" strokeWidth={2} />
              ) : (
                <List className="h-6 w-6" strokeWidth={2} />
              )}
            </NavSlot>
          </button>
        ) : (
          <NavLink to="/" className="flex-1 flex items-center justify-center" aria-label="Discover">
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
            className="flex-1 flex items-center justify-center"
            aria-label={item.label}
          >
            {({ isActive }) => (
              <NavSlot isActive={isActive} label={item.label}>
                <item.icon className="h-6 w-6" strokeWidth={2} />
              </NavSlot>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
