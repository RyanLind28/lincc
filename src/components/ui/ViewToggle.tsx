import { Map, List } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ViewMode = 'map' | 'list';

export interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center p-1 bg-surface rounded-xl border border-border shadow-sm',
        className
      )}
    >
      <button
        onClick={() => onChange('map')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
          value === 'map'
            ? 'gradient-primary text-white shadow-sm'
            : 'text-text-muted hover:text-text'
        )}
        aria-pressed={value === 'map'}
      >
        <Map className="h-4 w-4" />
        Map
      </button>
      <button
        onClick={() => onChange('list')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
          value === 'list'
            ? 'gradient-primary text-white shadow-sm'
            : 'text-text-muted hover:text-text'
        )}
        aria-pressed={value === 'list'}
      >
        <List className="h-4 w-4" />
        List
      </button>
    </div>
  );
}
