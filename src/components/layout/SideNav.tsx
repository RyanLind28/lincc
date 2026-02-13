import { NavLink, useLocation } from 'react-router-dom';
import { Map, List, MessageCircle, Calendar, User, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useViewMode } from '../../contexts/ViewModeContext';

const LOGO_URL = 'https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp';

export function SideNav() {
  const location = useLocation();
  const { viewMode, toggleViewMode } = useViewMode();
  const isOnHomePage = location.pathname === '/';

  const navItems = [
    { to: '/chats', icon: MessageCircle, label: 'Chats' },
    { to: '/my-events', icon: Calendar, label: 'My Events' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-border lg:bg-surface lg:h-screen lg:sticky lg:top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <NavLink to="/">
          <img src={LOGO_URL} alt="Lincc" className="h-8" />
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {/* Discover / Toggle */}
        {isOnHomePage ? (
          <button
            onClick={toggleViewMode}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl gradient-primary text-white font-medium transition-all"
          >
            {viewMode === 'list' ? (
              <>
                <Map className="h-5 w-5" />
                <span>Map View</span>
              </>
            ) : (
              <>
                <List className="h-5 w-5" />
                <span>List View</span>
              </>
            )}
          </button>
        ) : (
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all',
                isActive
                  ? 'gradient-primary text-white'
                  : 'text-text-muted hover:bg-gray-100 hover:text-text'
              )
            }
          >
            <Map className="h-5 w-5" />
            <span>Discover</span>
          </NavLink>
        )}

        {/* Other nav items */}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all',
                isActive
                  ? 'gradient-primary text-white'
                  : 'text-text-muted hover:bg-gray-100 hover:text-text'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Create Event CTA */}
      <div className="p-4 border-t border-border">
        <NavLink
          to="/event/new"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg transition-all"
        >
          <Plus className="h-5 w-5" />
          <span>Create Event</span>
        </NavLink>
      </div>
    </aside>
  );
}
