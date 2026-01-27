import { type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export interface ChipProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'selected';
  size?: 'sm' | 'md';
  onRemove?: () => void;
  icon?: React.ReactNode;
}

function Chip({
  className,
  variant = 'default',
  size = 'md',
  onRemove,
  icon,
  children,
  ...props
}: ChipProps) {
  const variants = {
    default: 'bg-gray-100 text-text-muted hover:bg-gray-200',
    primary: 'bg-primary/10 text-primary hover:bg-primary/20',
    selected: 'bg-primary text-white',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center font-medium rounded-full cursor-pointer transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex-shrink-0 ml-0.5 rounded-full hover:bg-black/10 p-0.5"
          aria-label="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export interface ChipGroupProps {
  options: Array<{ value: string; label: string; icon?: string }>;
  selected: string[];
  onChange: (selected: string[]) => void;
  max?: number;
  className?: string;
}

function ChipGroup({
  options,
  selected,
  onChange,
  max,
  className,
}: ChipGroupProps) {
  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else if (!max || selected.length < max) {
      onChange([...selected, value]);
    }
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <Chip
            key={option.value}
            variant={isSelected ? 'selected' : 'default'}
            onClick={() => handleToggle(option.value)}
            icon={option.icon ? <span>{option.icon}</span> : undefined}
          >
            {option.label}
          </Chip>
        );
      })}
    </div>
  );
}

export { Chip, ChipGroup };
