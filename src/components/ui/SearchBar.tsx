import { forwardRef, useState, useEffect, useRef, type InputHTMLAttributes } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  getSearchSuggestions,
  getRecentSearches,
  saveRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from '../../services/searchService';

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  onClear?: () => void;
  onSearchSubmit?: (term: string) => void;
  size?: 'sm' | 'md' | 'lg';
  showClear?: boolean;
  showSuggestions?: boolean;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      className,
      value,
      onClear,
      onSearchSubmit,
      size = 'md',
      showClear = true,
      showSuggestions = true,
      placeholder = 'What do you want to do?',
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const hasValue = value && String(value).length > 0;
    const [isFocused, setIsFocused] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    // Load recent searches when focused
    useEffect(() => {
      if (isFocused && showSuggestions) {
        setRecentSearches(getRecentSearches());
      }
    }, [isFocused, showSuggestions]);

    // Fetch suggestions as user types
    useEffect(() => {
      if (!showSuggestions) return;

      const query = String(value || '');
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const results = await getSearchSuggestions(query);
        setSuggestions(results);
      }, 300);

      return () => clearTimeout(debounceRef.current);
    }, [value, showSuggestions]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setIsFocused(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectSuggestion = (term: string) => {
      saveRecentSearch(term);
      setIsFocused(false);
      onSearchSubmit?.(term);
    };

    const handleRemoveRecent = (term: string, e: React.MouseEvent) => {
      e.stopPropagation();
      removeRecentSearch(term);
      setRecentSearches((prev) => prev.filter((s) => s !== term));
    };

    const handleClearRecent = () => {
      clearRecentSearches();
      setRecentSearches([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && hasValue) {
        saveRecentSearch(String(value));
        setIsFocused(false);
        onSearchSubmit?.(String(value));
      }
    };

    const showDropdown =
      isFocused &&
      showSuggestions &&
      (suggestions.length > 0 || (recentSearches.length > 0 && !hasValue));

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
      <div className={cn('relative', className)} ref={dropdownRef}>
        {/* Search icon */}
        <Search
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10',
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
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            onBlur?.(e);
          }}
          onKeyDown={handleKeyDown}
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
              'absolute top-1/2 -translate-y-1/2 p-1 rounded-full z-10',
              'text-text-muted hover:text-text hover:bg-gray-100',
              'transition-colors',
              rightPadding[size]
            )}
            aria-label="Clear search"
          >
            <X className={iconSizes[size]} />
          </button>
        )}

        {/* Suggestions dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface rounded-xl border border-border shadow-lg z-50 overflow-hidden">
            {/* Recent searches (shown when input is empty) */}
            {!hasValue && recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-3 pt-3 pb-1">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Recent
                  </span>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleClearRecent}
                    className="text-xs text-coral hover:text-coral/80"
                  >
                    Clear all
                  </button>
                </div>
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectSuggestion(term)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Clock className="h-4 w-4 text-text-light flex-shrink-0" />
                    <span className="text-sm text-text flex-1 truncate">{term}</span>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => handleRemoveRecent(term, e)}
                      className="p-0.5 text-text-light hover:text-text-muted"
                      aria-label="Remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </button>
                ))}
              </div>
            )}

            {/* Live suggestions (shown when typing) */}
            {hasValue && suggestions.length > 0 && (
              <div>
                <div className="px-3 pt-3 pb-1">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Suggestions
                  </span>
                </div>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <TrendingUp className="h-4 w-4 text-text-light flex-shrink-0" />
                    <span className="text-sm text-text truncate">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';
