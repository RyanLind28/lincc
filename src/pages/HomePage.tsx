import { useState, useMemo } from 'react';
import { SlidersHorizontal, MapPin, TrendingUp, Compass, Bookmark } from 'lucide-react';
import {
  SearchBar,
  FilterPills,
  EventCardGrid,
  BottomSheet,
  GradientButton,
  Slider,
  DatePicker,
  CategoryIcon,
  MapView,
  QUICK_DATE_OPTIONS,
} from '../components/ui';
import { useUserLocation } from '../hooks/useUserLocation';
import { Header } from '../components/layout';
import { useRecommendedEvents } from '../hooks/useRecommendedEvents';
import { useViewMode } from '../contexts/ViewModeContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { CATEGORIES } from '../data/categories';

// Map categories from data file to filter format (exclude "Other" — not useful as a filter)
const ALL_CATEGORIES = CATEGORIES
  .filter((cat) => cat.value !== 'other')
  .map((cat) => ({
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
    scoredEvents,
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

  // Get user location for map
  const { location: userLocation } = useUserLocation();

  // Bookmarks
  const { savedIds, toggleSave } = useBookmarks();

  // Result count
  const resultCount = events.length;

  // Trending events (most participants, only when no filters active)
  const trendingEvents = useMemo(() => {
    if (hasActiveFilters || filters.search) return [];
    return [...events]
      .sort((a, b) => (b.participant_count || 0) - (a.participant_count || 0))
      .filter((e) => (e.participant_count || 0) > 0)
      .slice(0, 4);
  }, [events, hasActiveFilters, filters.search]);

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
            onSearchSubmit={(term) => updateFilter('search', term)}
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
                {/* Quick action links (only when no search active) */}
                {!filters.search && (
                  <div className="flex gap-2 mb-4">
                    <a
                      href="/explore"
                      className="flex items-center gap-2 px-4 py-2.5 bg-surface rounded-xl border border-border hover:border-coral transition-colors"
                    >
                      <Compass className="h-4 w-4 text-coral" />
                      <span className="text-sm font-medium text-text">Explore</span>
                    </a>
                    <a
                      href="/saved"
                      className="flex items-center gap-2 px-4 py-2.5 bg-surface rounded-xl border border-border hover:border-coral transition-colors"
                    >
                      <Bookmark className="h-4 w-4 text-coral" />
                      <span className="text-sm font-medium text-text">Saved</span>
                    </a>
                  </div>
                )}

                {/* Trending section */}
                {trendingEvents.length > 0 && (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-coral" />
                      <h2 className="text-sm font-semibold text-text uppercase tracking-wide">
                        Popular near you
                      </h2>
                    </div>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                      {trendingEvents.map((event) => (
                        <a
                          key={event.id}
                          href={`/event/${event.id}`}
                          className="flex-shrink-0 w-[200px] bg-surface rounded-xl border border-border p-3 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <CategoryIcon icon={event.category?.icon || 'Calendar'} size="sm" />
                            <span className="text-xs font-medium text-coral truncate">
                              {event.category?.name || 'Event'}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-text truncate mb-1">
                            {event.title}
                          </h3>
                          <p className="text-xs text-text-muted truncate">
                            {event.participant_count || 0} joined
                          </p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* All events header */}
                {!hasActiveFilters && !filters.search && events.length > 0 && (
                  <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
                    All Events
                  </h2>
                )}

                <EventCardGrid
                  events={events}
                  onToggleSave={toggleSave}
                  savedIds={savedIds}
                />

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
          <div className="h-full relative">
            {!hasLocation ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <div className="text-center p-8">
                  <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-text mb-2">Enable Location</h2>
                  <p className="text-text-muted mb-4 max-w-xs">
                    Allow location access to discover events near you.
                  </p>
                  <GradientButton onClick={refreshLocation}>Enable Location</GradientButton>
                </div>
              </div>
            ) : (
              <MapView
                events={scoredEvents}
                userLocation={userLocation}
                radiusKm={distance}
                className="absolute inset-0"
              />
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
