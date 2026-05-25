import { MapPin, Clock, LayoutGrid, Calendar, RotateCcw, Loader2, Navigation } from 'lucide-react';
import {
  BottomSheet,
  GradientButton,
  Slider,
  DatePicker,
  CategoryIcon,
  QUICK_DATE_OPTIONS,
} from '../ui';

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: { timeRange: string | null; categories: string[] };
  updateFilter: (key: string, value: unknown) => void;
  distance: number;
  setDistance: (d: number) => void;
  showDatePicker: boolean;
  setShowDatePicker: (v: boolean) => void;
  selectedDate: Date | null;
  setSelectedDate: (d: Date | null) => void;
  hasLocation: boolean;
  locationName: string | null;
  isLocationLoading: boolean;
  locationPermission: string | null;
  locationError: string | null;
  onEnableLocation: () => void;
  resultCount: number;
  totalAvailable: number;
  hasFiltersToReset: boolean;
  onReset: () => void;
  categories: Array<{ value: string; label: string; icon: string }>;
}

export function FilterSheet({
  isOpen,
  onClose,
  filters,
  updateFilter,
  distance,
  setDistance,
  showDatePicker,
  setShowDatePicker,
  selectedDate,
  setSelectedDate,
  hasLocation,
  locationName,
  isLocationLoading,
  locationPermission,
  locationError,
  onEnableLocation,
  resultCount,
  totalAvailable,
  hasFiltersToReset,
  onReset,
  categories,
}: FilterSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Filters">
      {/* When */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-coral" />
          <span className="text-sm font-semibold text-text">When</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_DATE_OPTIONS.slice(0, -1).map((option) => (
            <button
              key={option.value}
              onClick={() => {
                updateFilter('timeRange', option.value);
                setShowDatePicker(false);
                setSelectedDate(null);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all press-effect ${
                filters.timeRange === option.value && !selectedDate
                  ? 'gradient-primary text-white shadow-sm'
                  : 'bg-background text-text-muted hover:bg-border'
              }`}
            >
              {option.label}
            </button>
          ))}
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all press-effect ${
              showDatePicker || selectedDate
                ? 'gradient-primary text-white shadow-sm'
                : 'bg-background text-text-muted hover:bg-border'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            {selectedDate
              ? selectedDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Pick a date'}
          </button>
        </div>
        {showDatePicker && (
          <DatePicker
            value={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
              if (date) {
                updateFilter('timeRange', null);
              }
            }}
            className="mt-3"
          />
        )}
      </div>

      <div className="h-px bg-border mb-5" />

      {/* Distance */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-4 w-4 text-coral" />
          <span className="text-sm font-semibold text-text">Distance</span>
          <span className="ml-auto text-lg font-bold gradient-text">{distance} km</span>
        </div>
        {hasLocation && locationName ? (
          <p className="text-xs text-text-muted mb-3 ml-6">from {locationName}</p>
        ) : isLocationLoading ? (
          <p className="text-xs text-text-muted mb-3 ml-6 flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            Finding your location…
          </p>
        ) : locationPermission === 'denied' ? (
          <div className="ml-6 mb-3">
            <p className="text-xs text-warning mb-1">Location is blocked in your browser.</p>
            <p className="text-micro text-text-muted leading-snug">
              Click the lock/info icon in the address bar, allow Location for this site, then reload.
            </p>
          </div>
        ) : (
          <div className="ml-6 mb-3">
            <p className="text-xs text-text-muted mb-1.5">
              {locationError ? "Couldn't get your location." : 'Location not enabled.'}
            </p>
            <button
              type="button"
              onClick={onEnableLocation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-coral bg-coral/10 hover:bg-coral/15 rounded-full transition-colors"
            >
              <Navigation className="h-3 w-3" />
              Enable location
            </button>
          </div>
        )}
        <Slider value={distance} onChange={setDistance} min={1} max={100} step={1} showValue={false} />
        <div className="flex justify-between mt-1">
          <span className="text-micro text-text-light">1 km</span>
          <span className="text-micro text-text-light">100 km</span>
        </div>
      </div>

      <div className="h-px bg-border mb-5" />

      {/* Categories */}
      <div className="pb-24">
        <div className="flex items-center gap-2 mb-3">
          <LayoutGrid className="h-4 w-4 text-coral" />
          <span className="text-sm font-semibold text-text">Categories</span>
          {filters.categories.length > 0 && (
            <span className="ml-auto text-xs font-medium text-coral bg-coral/10 px-2 py-0.5 rounded-full">
              {filters.categories.length} selected
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 lg:grid-cols-6 gap-2">
          {categories.map((category) => {
            const isSelected = filters.categories.includes(category.value);
            return (
              <button
                key={category.value}
                onClick={() => {
                  updateFilter('categories', isSelected ? [] : [category.value]);
                }}
                aria-pressed={isSelected}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all press-effect ${
                  isSelected
                    ? 'gradient-primary text-white shadow-sm scale-[0.97]'
                    : 'bg-background text-text-muted hover:bg-border border border-transparent hover:border-border'
                }`}
              >
                <CategoryIcon icon={category.icon} size="lg" />
                <span className="text-micro font-medium leading-tight text-center">{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="sticky bottom-[-16px] z-10 bg-surface pt-3 pb-5 border-t border-border -mx-4 px-4">
        <p className="text-xs text-text-muted text-center mb-2">
          {resultCount} of {totalAvailable} events match
        </p>
        <div className="flex gap-3">
          {hasFiltersToReset && (
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-border text-sm font-medium text-text-muted hover:text-coral hover:border-coral transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          )}
          <GradientButton fullWidth onClick={onClose} className="flex-1">
            Show {resultCount} {resultCount === 1 ? 'Event' : 'Events'}
          </GradientButton>
        </div>
      </div>
    </BottomSheet>
  );
}
