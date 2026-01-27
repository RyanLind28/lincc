import { cn } from '../../lib/utils';
import { X } from 'lucide-react';
import { CategoryIcon, iconMap } from './CategoryIcon';

export interface FilterOption {
  value: string;
  label: string;
  icon?: string;
}

export interface FilterPillsProps {
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multiple?: boolean;
  className?: string;
}

export function FilterPills({
  options,
  selected,
  onChange,
  multiple = true,
  className,
}: FilterPillsProps) {
  const handleToggle = (value: string) => {
    if (multiple) {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value));
      } else {
        onChange([...selected, value]);
      }
    } else {
      onChange(selected.includes(value) ? [] : [value]);
    }
  };

  return (
    <div className={cn('flex gap-2 overflow-x-auto scrollbar-hide', className)}>
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <button
            key={option.value}
            onClick={() => handleToggle(option.value)}
            className={cn(
              'flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
              'transition-all duration-200 press-effect',
              isSelected
                ? 'gradient-primary text-white shadow-sm'
                : 'bg-surface border border-border text-text-muted hover:border-coral hover:text-coral'
            )}
          >
            {option.icon && iconMap[option.icon] && <CategoryIcon icon={option.icon} size="sm" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export interface ActiveFiltersProps {
  filters: { key: string; label: string }[];
  onRemove: (key: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export function ActiveFilters({
  filters,
  onRemove,
  onClearAll,
  className,
}: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {filters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-coral/10 text-coral rounded-full text-sm font-medium"
        >
          {filter.label}
          <button
            onClick={() => onRemove(filter.key)}
            className="p-0.5 hover:bg-coral/20 rounded-full transition-colors"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {onClearAll && filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-text-muted hover:text-text transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
