import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { searchPlaces, getPlaceDetails, type PlacePrediction, type PlaceDetails } from '../../services/placesService';

export interface PlacesAutocompleteProps {
  onSelect: (place: PlaceDetails) => void;
  /** Pre-filled venue name (e.g. when editing) */
  defaultValue?: string;
  /** User's current location to bias results */
  userLocation?: { lat: number; lng: number } | null;
  placeholder?: string;
  className?: string;
}

export function PlacesAutocomplete({
  onSelect,
  defaultValue = '',
  userLocation,
  placeholder = 'Search for a venue...',
  className,
}: PlacesAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (value.trim().length < 2) {
        setPredictions([]);
        setIsOpen(false);
        return;
      }

      setIsSearching(true);
      debounceRef.current = setTimeout(async () => {
        const results = await searchPlaces(
          value,
          userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined,
        );
        setPredictions(results);
        setIsOpen(results.length > 0);
        setIsSearching(false);
      }, 300);
    },
    [userLocation],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedPlace(null);
    handleSearch(value);
  };

  const handleSelect = async (prediction: PlacePrediction) => {
    setQuery(prediction.mainText);
    setIsOpen(false);
    setPredictions([]);
    setIsLoadingDetails(true);

    const details = await getPlaceDetails(prediction.placeId);
    setIsLoadingDetails(false);

    if (details) {
      setSelectedPlace(details);
      onSelect(details);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSelectedPlace(null);
    setPredictions([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => predictions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-10 py-2.5 bg-surface border rounded-lg text-text placeholder:text-text-light',
            'focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral transition-colors',
            selectedPlace ? 'border-coral/50' : 'border-border',
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isSearching || isLoadingDetails ? (
            <Loader2 className="h-4 w-4 text-text-muted animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-text-muted hover:text-text transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Selected place details */}
      {selectedPlace && (
        <div className="mt-2 px-3 py-2 bg-coral/5 border border-coral/20 rounded-lg">
          <p className="text-sm font-medium text-text">{selectedPlace.name}</p>
          <p className="text-xs text-text-muted">{selectedPlace.address}</p>
          {selectedPlace.rating && (
            <p className="text-xs text-text-muted mt-0.5">
              {'★'.repeat(Math.round(selectedPlace.rating))} {selectedPlace.rating.toFixed(1)}
              {selectedPlace.userRatingCount ? ` (${selectedPlace.userRatingCount})` : ''}
            </p>
          )}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-surface border border-border rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.placeId}
              type="button"
              onClick={() => handleSelect(prediction)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-border/50 last:border-b-0"
            >
              <MapPin className="h-4 w-4 text-coral mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-text truncate">
                  {prediction.mainText}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {prediction.secondaryText}
                </p>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 bg-gray-50/50">
            <p className="text-[10px] text-text-light text-center">Powered by Google</p>
          </div>
        </div>
      )}
    </div>
  );
}
