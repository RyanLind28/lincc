import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { SideNav } from './SideNav';
import { InstallBanner } from '../pwa/InstallBanner';
import { cn } from '../../lib/utils';

interface MainLayoutProps {
  showBottomNav?: boolean;
  className?: string;
}

export function MainLayout({ showBottomNav = true, className }: MainLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background lg:flex', className)}>
      {/* Desktop sidebar - hidden on mobile */}
      {showBottomNav && <SideNav />}

      {/* Main content area */}
      <main className={cn('flex-1', showBottomNav && 'pb-20 lg:pb-0')}>
        <div className="lg:max-w-6xl lg:mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav - hidden on desktop */}
      {showBottomNav && <BottomNav />}

      {/* PWA install banner */}
      <InstallBanner />
    </div>
  );
}
