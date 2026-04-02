import { useState, useEffect, useRef, useCallback } from 'react';
import { SlidersHorizontal, MapPin, Ticket, Clock, LayoutGrid, Calendar, RotateCcw, Loader2 } from 'lucide-react';
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
  VoucherTile,
  EventCardGridSkeleton,
  QUICK_DATE_OPTIONS,
} from '../components/ui';
import { useUserLocation } from '../hooks/useUserLocation';
import { useLocationName } from '../hooks/useLocationName';
import { Header } from '../components/layout';
import { useRecommendedEvents } from '../hooks/useRecommendedEvents';
import { useViewMode } from '../contexts/ViewModeContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { CATEGORIES } from '../data/categories';
import { getActiveVouchers } from '../services/voucherService';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import type { VoucherWithDetails } from '../types';

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Map categories from data file to filter format (exclude "Other" — not useful as a filter)
const ALL_CATEGORIES = CATEGORIES
  .filter((cat) => cat.value !== 'other')
  .map((cat) => ({
    value: cat.value,
    label: cat.label,
    icon: cat.icon,
  }));

export default function HomePage() {
  const { viewMode } = useViewMode();
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [distance, setDistance] = useState(10);
  const [debouncedDistance, setDebouncedDistance] = useState(10);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [vouchers, setVouchers] = useState<VoucherWithDetails[]>([]);

  // Debounce distance so the slider doesn't hammer Supabase on every tick
  const distanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    distanceTimerRef.current = setTimeout(() => setDebouncedDistance(distance), 300);
    return () => { if (distanceTimerRef.current) clearTimeout(distanceTimerRef.current); };
  }, [distance]);

  // Use the recommendation hook with debounced distance
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
    refresh,
    fallbackUsed,
  } = useRecommendedEvents({ maxDistance: debouncedDistance });

  // Get user location for map + readable name
  const { location: userLocation } = useUserLocation();
  const { locationName } = useLocationName(userLocation);

  // Bookmarks
  const { savedIds, toggleSave } = useBookmarks();

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    refresh();
    // Allow time for the re-fetch to complete
    await new Promise(r => setTimeout(r, 800));
  }, [refresh]);
  const { pullDistance, isRefreshing, handlers: pullHandlers } = usePullToRefresh({ onRefresh: handleRefresh });

  // Split events into nearby and further away
  const nearbyEvents = events.filter((e) => e.distance_km !== undefined && e.distance_km <= debouncedDistance);
  const furtherEvents = events.filter((e) => e.distance_km === undefined || e.distance_km > debouncedDistance);

  // Result count + reset state
  const resultCount = events.length;
  const hasFiltersToReset = hasActiveFilters || distance !== 10 || selectedDate !== null;

  // Fetch vouchers and split by distance
  useEffect(() => {
    getActiveVouchers().then(setVouchers).catch(console.error);
  }, []);

  // Split vouchers into nearby vs further away
  const nearbyVouchers = userLocation
    ? vouchers.filter((v) => {
        const d = haversine(userLocation.latitude, userLocation.longitude, v.venue_lat, v.venue_lng);
        return d <= debouncedDistance;
      })
    : vouchers;
  const farVouchers = userLocation
    ? vouchers.filter((v) => {
        const d = haversine(userLocation.latitude, userLocation.longitude, v.venue_lat, v.venue_lng);
        return d > debouncedDistance;
      })
    : [];

  return (
    <div className="h-screen flex flex-col bg-background max-w-4xl mx-auto">
      {/* Header - Instagram style */}
      <Header showLogo showCreateEvent showNotifications />

      {/* Search and Filters */}
      <div className="px-4 py-3 space-y-3 bg-background">
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

        {/* Category quick filters - horizontal scroll, all categories */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <FilterPills
            options={ALL_CATEGORIES}
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
          <div className="h-full overflow-y-auto scrollbar-hide p-4 pb-24" {...pullHandlers}>
            {/* Pull to refresh indicator */}
            {(pullDistance > 0 || isRefreshing) && (
              <div
                className="flex items-center justify-center transition-all duration-200 overflow-hidden"
                style={{ height: pullDistance > 0 ? pullDistance : isRefreshing ? 40 : 0 }}
              >
                <Loader2 className={`h-5 w-5 text-coral ${isRefreshing ? 'animate-spin' : ''}`}
                  style={{ opacity: Math.min(pullDistance / 60, 1), transform: `rotate(${pullDistance * 3}deg)` }}
                />
              </div>
            )}
            {/* Loading state */}
            {isLoading ? (
              <EventCardGridSkeleton count={4} />
            ) : (
              <>
                {/* Vouchers Near You section */}
                {nearbyVouchers.length > 0 && !filters.search && (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Ticket className="h-4 w-4 text-coral" />
                      <h2 className="text-sm font-semibold text-text uppercase tracking-wide">
                        Vouchers Near You
                      </h2>
                      {locationName && (
                        <span className="ml-auto text-xs text-text-muted">{locationName}</span>
                      )}
                    </div>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                      {nearbyVouchers.map((voucher) => (
                        <VoucherTile key={voucher.id} voucher={voucher} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Vouchers Further Away */}
                {farVouchers.length > 0 && !filters.search && (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Ticket className="h-4 w-4 text-purple" />
                      <h2 className="text-sm font-semibold text-text uppercase tracking-wide">
                        Vouchers Further Away
                      </h2>
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-purple/10 text-purple rounded-full">
                        {farVouchers.length} available
                      </span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                      {farVouchers.map((voucher) => (
                        <VoucherTile key={voucher.id} voucher={voucher} />
                      ))}
                    </div>
                  </div>
                )}

                {events.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
                      <Calendar className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-text mb-1">No events found</h2>
                    <p className="text-sm text-text-muted text-center mb-4 max-w-xs">
                      {hasActiveFilters || filters.search
                        ? 'Try adjusting your filters or search to find more events.'
                        : 'There are no events near you right now. Be the first to create one!'}
                    </p>
                    {hasActiveFilters || filters.search ? (
                      <GradientButton variant="outline" onClick={clearAll}>
                        <RotateCcw className="h-4 w-4 mr-1.5" />
                        Clear Filters
                      </GradientButton>
                    ) : (
                      <GradientButton onClick={() => (window.location.href = '/event/new')}>
                        Create Event
                      </GradientButton>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Events Near You */}
                    {nearbyEvents.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="h-4 w-4 text-coral" />
                          <h2 className="text-sm font-semibold text-text uppercase tracking-wide">
                            Events Near You
                          </h2>
                          {locationName && (
                            <span className="ml-auto text-xs text-text-muted">{locationName}</span>
                          )}
                        </div>
                        <EventCardGrid
                          events={nearbyEvents}
                          onToggleSave={toggleSave}
                          savedIds={savedIds}
                        />
                      </div>
                    )}

                    {/* Events Further Away */}
                    {furtherEvents.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="h-4 w-4 text-purple" />
                          <h2 className="text-sm font-semibold text-text uppercase tracking-wide">
                            {nearbyEvents.length > 0 ? 'Events Further Away' : 'Events Near You'}
                          </h2>
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-purple/10 text-purple rounded-full">
                            {furtherEvents.length}
                          </span>
                        </div>
                        <EventCardGrid
                          events={furtherEvents}
                          onToggleSave={toggleSave}
                          savedIds={savedIds}
                        />
                      </div>
                    )}

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
        title="Filters"
      >
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
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${
                    filters.timeRange === option.value && !selectedDate
                      ? 'gradient-primary text-white shadow-sm'
                      : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`
                inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${
                  showDatePicker || selectedDate
                    ? 'gradient-primary text-white shadow-sm'
                    : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                }
              `}
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

        {/* Divider */}
        <div className="h-px bg-border mb-5" />

        {/* Distance */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-coral" />
            <span className="text-sm font-semibold text-text">Distance</span>
            <span className="ml-auto text-lg font-bold gradient-text">{distance} km</span>
          </div>
          {locationName && (
            <p className="text-xs text-text-muted mb-3 ml-6">from {locationName}</p>
          )}
          <Slider
            value={distance}
            onChange={setDistance}
            min={1}
            max={100}
            step={1}
            showValue={false}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-text-light">1 km</span>
            <span className="text-[10px] text-text-light">100 km</span>
          </div>
        </div>

        {/* Divider */}
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
                    flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all
                    ${
                      isSelected
                        ? 'gradient-primary text-white shadow-sm scale-[0.97]'
                        : 'bg-gray-50 text-text-muted hover:bg-gray-100 border border-transparent hover:border-gray-200'
                    }
                  `}
                >
                  <CategoryIcon icon={category.icon} size="lg" />
                  <span className="text-[11px] font-medium leading-tight text-center">{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions — pinned to bottom */}
        <div className="sticky bottom-[-16px] z-10 bg-surface pt-3 pb-5 border-t border-border -mx-4 px-4">
          <p className="text-xs text-text-muted text-center mb-2">
            {resultCount} of {totalAvailable} events match
          </p>
          <div className="flex gap-3">
            {hasFiltersToReset && (
              <button
                onClick={() => {
                  clearAll();
                  setDistance(10);
                  setSelectedDate(null);
                  setShowDatePicker(false);
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-border text-sm font-medium text-text-muted hover:text-coral hover:border-coral transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            )}
            <GradientButton
              fullWidth
              onClick={() => setIsFilterSheetOpen(false)}
              className="flex-1"
            >
              Show {resultCount} {resultCount === 1 ? 'Event' : 'Events'}
            </GradientButton>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
