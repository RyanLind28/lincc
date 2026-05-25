import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <div className={cn('animate-slide-up-sm', className)}>
      {children}
    </div>
  );
}
