import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { SideNav } from './SideNav';
import { InstallBanner } from '../pwa/InstallBanner';
import { NotificationPermissionPrompt } from '../ui/NotificationPermissionPrompt';
import { WelcomeGuide } from '../ui/WelcomeGuide';
import { BusinessApprovalBanner } from '../business/BusinessApprovalBanner';
import { cn } from '../../lib/utils';

interface MainLayoutProps {
  showBottomNav?: boolean;
  className?: string;
}

export function MainLayout({ showBottomNav = true, className }: MainLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background lg:flex', className)}>
      {/* Skip to content link (accessibility) */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-coral focus:text-white focus:rounded-lg">
        Skip to content
      </a>

      {/* Desktop sidebar — always present in the app shell, hidden on mobile via its internal lg:flex */}
      <SideNav />

      {/* Main content area — always shifted right of the sidebar on desktop. Bottom-padding only when the mobile bottom nav is visible. */}
      <main id="main-content" className={cn('flex-1 animate-fade-in lg:pl-16', showBottomNav && 'pb-20 lg:pb-0')}>
        <BusinessApprovalBanner />
        <NotificationPermissionPrompt />
        <Outlet />
      </main>

      {/* Mobile bottom nav - hidden on desktop */}
      {showBottomNav && <BottomNav />}

      {/* PWA install banner */}
      <InstallBanner />

      {/* First-time user welcome guide */}
      <WelcomeGuide />
    </div>
  );
}
