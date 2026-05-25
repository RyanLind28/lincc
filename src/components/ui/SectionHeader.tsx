import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  iconColor?: string;
  badge?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

export function SectionHeader({
  icon,
  title,
  iconColor = 'text-coral',
  badge,
  trailing,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center gap-2 mb-3', className)}>
      <span className={iconColor}>{icon}</span>
      <h2 className="text-section-label">{title}</h2>
      {badge}
      {trailing && <span className="ml-auto text-xs text-text-muted">{trailing}</span>}
    </div>
  );
}
