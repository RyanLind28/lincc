import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { cn } from '../../lib/utils';

interface MainLayoutProps {
  showBottomNav?: boolean;
  className?: string;
}

export function MainLayout({ showBottomNav = true, className }: MainLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <main className={cn('flex-1', showBottomNav && 'pb-20')}>
        <Outlet />
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
