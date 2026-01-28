import { useState } from 'react';
import { SlidersHorizontal, MapPin, Navigation } from 'lucide-react';
import {
  SearchBar,
  FilterPills,
  EventCardGrid,
  BottomSheet,
  GradientButton,
  Slider,
  DatePicker,
  CategoryIcon,
  QUICK_DATE_OPTIONS,
} from '../components/ui';
import { Header } from '../components/layout';
import { useRecommendedEvents } from '../hooks/useRecommendedEvents';
import { useViewMode } from '../contexts/ViewModeContext';
import { CATEGORIES } from '../data/categories';

// Map categories from data file to filter format
const ALL_CATEGORIES = CATEGORIES.map((cat) => ({
  value: cat.value,
  label: cat.label,
  icon: cat.icon,
}));

// Quick category filters for top bar
const QUICK_CATEGORIES = ALL_CATEGORIES.slice(0, 6);

export default function HomePage() {
  const { viewMode } = useViewMode();
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [distance, setDistance] = useState(10);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Use the recommendation hook
  const {
    events,
    isLoading,
    totalAvailable,
    filters,
    updateFilter,
    activeFilters,
    clearAll,
    hasActiveFilters,
    hasLocation,
    refreshLocation,
  } = useRecommendedEvents({ maxDistance: distance });

  // Result count
  const resultCount = events.length;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header - Instagram style */}
      <Header showLogo showCreateEvent showNotifications />

      {/* Search and Filters */}
      <div className="px-4 py-3 space-y-3 bg-surface border-b border-border">
        {/* Search bar with filter button */}
        <div className="flex gap-2">
          <SearchBar
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            onClear={() => updateFilter('search', '')}
            className="flex-1"
          />
          <button
            onClick={() => setIsFilterSheetOpen(true)}
            className={`
              p-3 rounded-xl border transition-all relative
              ${hasActiveFilters
                ? 'bg-coral text-white border-coral'
                : 'bg-surface text-text-muted border-border hover:border-coral hover:text-coral'
              }
            `}
            aria-label="Filters"
          >
            <SlidersHorizontal className="h-5 w-5" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>

        {/* Category quick filters - horizontal scroll hidden */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <FilterPills
            options={QUICK_CATEGORIES}
            selected={filters.categories}
            onChange={(selected) => updateFilter('categories', selected)}
            className="flex-nowrap"
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'list' ? (
          /* List View - Grid of cards */
          <div className="h-full overflow-y-auto scrollbar-hide p-4 pb-24">
            {/* Loading state */}
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-surface rounded-2xl border border-border overflow-hidden animate-pulse"
                  >
                    <div className="aspect-[4/3] bg-gray-200" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <EventCardGrid events={events} />

                {/* End of list CTA */}
                <div className="mt-6 mb-4 text-center">
                  <div className="inline-block p-6 bg-surface rounded-2xl border border-border">
                    <p className="text-text-muted mb-3">Can't find what you're looking for?</p>
                    <GradientButton onClick={() => (window.location.href = '/event/new')}>
                      Create Your Own Event
                    </GradientButton>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Map View */
          <div className="h-full bg-gray-200 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-text mb-2">
                  {hasLocation ? 'Map Coming Soon' : 'Enable Location'}
                </h2>
                <p className="text-text-muted mb-4 max-w-xs">
                  {hasLocation
                    ? 'The map will display events near you. Configure Mapbox to enable.'
                    : 'Allow location access to discover events near you.'}
                </p>
                {!hasLocation && (
                  <GradientButton onClick={refreshLocation}>Enable Location</GradientButton>
                )}
              </div>
            </div>

            {hasLocation && (
              <button
                className="absolute bottom-24 right-4 p-3 bg-surface rounded-full shadow-lg border border-border hover:shadow-xl transition-shadow"
                aria-label="Recenter map"
              >
                <Navigation className="h-5 w-5 text-text" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Bottom Sheet */}
      <BottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filter Events"
      >
        <div className="space-y-6 pb-4 max-h-[70vh] overflow-y-auto scrollbar-hide">
          {/* Result count */}
          <div className="flex items-center justify-between py-2 px-3 bg-coral/10 rounded-xl">
            <span className="text-sm text-text-muted">Showing</span>
            <span className="font-semibold text-coral">
              {resultCount} of {totalAvailable} events
            </span>
          </div>

          {/* When - Quick options + Date picker */}
          <div>
            <label className="block text-sm font-semibold text-text mb-3">When</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {QUICK_DATE_OPTIONS.slice(0, -1).map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    if (option.value === 'custom') {
                      setShowDatePicker(true);
                    } else {
                      updateFilter('timeRange', option.value);
                      setShowDatePicker(false);
                      setSelectedDate(null);
                    }
                  }}
                  className={`
                    py-2.5 px-3 rounded-xl text-sm font-medium transition-all
                    ${
                      filters.timeRange === option.value
                        ? 'gradient-primary text-white shadow-sm'
                        : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`
                w-full py-2.5 px-3 rounded-xl text-sm font-medium transition-all
                ${
                  showDatePicker || selectedDate
                    ? 'gradient-primary text-white shadow-sm'
                    : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                }
              `}
            >
              {selectedDate
                ? selectedDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Pick a date'}
            </button>
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

          {/* Distance - Slider */}
          <div>
            <Slider
              label="Distance"
              value={distance}
              onChange={setDistance}
              min={1}
              max={20}
              step={1}
              formatValue={(v) => `${v} km`}
            />
          </div>

          {/* Categories - Grid */}
          <div>
            <label className="block text-sm font-semibold text-text mb-3">Categories</label>
            <div className="grid grid-cols-4 gap-2">
              {ALL_CATEGORIES.map((category) => {
                const isSelected = filters.categories.includes(category.value);
                return (
                  <button
                    key={category.value}
                    onClick={() => {
                      if (isSelected) {
                        updateFilter(
                          'categories',
                          filters.categories.filter((c) => c !== category.value)
                        );
                      } else {
                        updateFilter('categories', [...filters.categories, category.value]);
                      }
                    }}
                    className={`
                      flex flex-col items-center gap-1 p-3 rounded-xl transition-all
                      ${
                        isSelected
                          ? 'gradient-primary text-white shadow-sm'
                          : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                      }
                    `}
                  >
                    <CategoryIcon icon={category.icon} size="lg" />
                    <span className="text-xs font-medium">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 sticky bottom-0 bg-surface pb-2">
            <button
              onClick={() => {
                clearAll();
                setDistance(10);
                setSelectedDate(null);
                setShowDatePicker(false);
              }}
              className="flex-1 py-3 text-text-muted hover:text-text transition-colors font-medium"
            >
              Clear All
            </button>
            <GradientButton
              fullWidth
              onClick={() => setIsFilterSheetOpen(false)}
              className="flex-1"
            >
              Show {resultCount} Results
            </GradientButton>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
