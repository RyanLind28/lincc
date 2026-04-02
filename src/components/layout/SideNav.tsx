import { NavLink, useLocation } from 'react-router-dom';
import { Map, List, MessageCircle, Calendar, User, Plus, Bell } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useViewMode } from '../../contexts/ViewModeContext';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';

function NavIcon({ icon: Icon, isActive, badge }: { icon: typeof Map; isActive: boolean; badge?: number }) {
  return (
    <div className="relative flex-shrink-0">
      <Icon className={cn('h-6 w-6', isActive ? 'text-coral' : 'text-text-muted')} />
      {badge ? (
        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-error rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </div>
  );
}

export function SideNav() {
  const location = useLocation();
  const { viewMode, toggleViewMode } = useViewMode();
  const isOnHomePage = location.pathname === '/';
  const unreadCount = useUnreadNotificationCount();

  const navItems = [
    { to: '/chats', icon: MessageCircle, label: 'Chats', badge: 0 },
    { to: '/my-events', icon: Calendar, label: 'Events', badge: 0 },
    { to: '/notifications', icon: Bell, label: 'Alerts', badge: unreadCount },
    { to: '/profile', icon: User, label: 'Profile', badge: 0 },
  ];

  return (
    <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:flex lg:flex-col lg:w-16 lg:z-30 hover:lg:w-48 bg-surface backdrop-blur-sm group/sidebar transition-all duration-200 lg:pt-14">
      <nav className="flex-1 flex flex-col items-center justify-center gap-3 px-3">
        {/* Discover / Toggle */}
        {isOnHomePage ? (
          <button onClick={toggleViewMode} className="relative">
            {/* Collapsed */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full text-coral hover:bg-coral/10 transition-all group-hover/sidebar:hidden mx-auto">
              {viewMode === 'list' ? <Map className="h-6 w-6" /> : <List className="h-6 w-6" />}
            </div>
            {/* Expanded */}
            <div className="hidden group-hover/sidebar:flex items-center gap-3 px-3 py-2.5 rounded-xl text-coral hover:bg-coral/10 transition-all">
              {viewMode === 'list' ? <Map className="h-6 w-6 flex-shrink-0" /> : <List className="h-6 w-6 flex-shrink-0" />}
              <span className="text-sm font-medium whitespace-nowrap">{viewMode === 'list' ? 'Map View' : 'List View'}</span>
            </div>
          </button>
        ) : (
          <NavLink to="/">
            {({ isActive }) => (
              <>
                {/* Collapsed */}
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full transition-all group-hover/sidebar:hidden mx-auto',
                  isActive ? 'bg-coral/10' : 'hover:bg-gray-100'
                )}>
                  <NavIcon icon={Map} isActive={isActive} />
                </div>
                {/* Expanded */}
                <div className={cn(
                  'hidden group-hover/sidebar:flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                  isActive ? 'bg-coral/10' : 'hover:bg-gray-100'
                )}>
                  <NavIcon icon={Map} isActive={isActive} />
                  <span className={cn('text-sm font-medium whitespace-nowrap', isActive ? 'text-coral' : 'text-text-muted')}>Discover</span>
                </div>
              </>
            )}
          </NavLink>
        )}

        {/* Nav items */}
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to}>
            {({ isActive }) => (
              <>
                {/* Collapsed: circle */}
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full transition-all group-hover/sidebar:hidden mx-auto',
                  isActive ? 'bg-coral/10' : 'hover:bg-gray-100'
                )}>
                  <NavIcon icon={item.icon} isActive={isActive} badge={item.badge || undefined} />
                </div>
                {/* Expanded: row */}
                <div className={cn(
                  'hidden group-hover/sidebar:flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                  isActive ? 'bg-coral/10' : 'hover:bg-gray-100'
                )}>
                  <NavIcon icon={item.icon} isActive={isActive} badge={item.badge || undefined} />
                  <span className={cn('text-sm font-medium whitespace-nowrap', isActive ? 'text-coral' : 'text-text-muted')}>{item.label}</span>
                </div>
              </>
            )}
          </NavLink>
        ))}

        {/* Create Event */}
        <NavLink to="/event/new" className="mt-2">
          {/* Collapsed: circle */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full gradient-primary text-white hover:shadow-lg transition-all group-hover/sidebar:hidden mx-auto">
            <Plus className="h-5 w-5" />
          </div>
          {/* Expanded: button */}
          <div className="hidden group-hover/sidebar:flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl gradient-primary text-white hover:shadow-lg transition-all">
            <Plus className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-semibold whitespace-nowrap">Create</span>
          </div>
        </NavLink>
      </nav>
    </aside>
  );
}
