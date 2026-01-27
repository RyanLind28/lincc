import { forwardRef, type InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  onClear?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showClear?: boolean;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      className,
      value,
      onClear,
      size = 'md',
      showClear = true,
      placeholder = 'What do you want to do?',
      ...props
    },
    ref
  ) => {
    const hasValue = value && String(value).length > 0;

    const sizes = {
      sm: 'h-10 pl-9 pr-9 text-sm',
      md: 'h-12 pl-11 pr-11 text-base',
      lg: 'h-14 pl-12 pr-12 text-lg',
    };

    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const leftPadding = {
      sm: 'left-2.5',
      md: 'left-3.5',
      lg: 'left-4',
    };

    const rightPadding = {
      sm: 'right-2.5',
      md: 'right-3.5',
      lg: 'right-4',
    };

    return (
      <div className={cn('relative', className)}>
        {/* Search icon */}
        <Search
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-text-muted pointer-events-none',
            iconSizes[size],
            leftPadding[size]
          )}
        />

        {/* Input */}
        <input
          ref={ref}
          type="text"
          value={value}
          placeholder={placeholder}
          className={cn(
            'w-full bg-surface rounded-xl border border-border',
            'text-text placeholder:text-text-light',
            'focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral',
            'transition-all duration-200',
            'shadow-sm hover:shadow-md',
            sizes[size]
          )}
          {...props}
        />

        {/* Clear button */}
        {showClear && hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 p-1 rounded-full',
              'text-text-muted hover:text-text hover:bg-gray-100',
              'transition-colors',
              rightPadding[size]
            )}
            aria-label="Clear search"
          >
            <X className={iconSizes[size]} />
          </button>
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';
