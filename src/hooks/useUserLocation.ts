// User location hook with caching
// Wraps Geolocation API with 5-minute cache and graceful error handling

import { useState, useEffect, useCallback } from 'react';
import type { Coordinates } from '../types';

// Cache duration: 5 minutes
const CACHE_DURATION_MS = 5 * 60 * 1000;

// Default location (Central London)
const DEFAULT_LOCATION: Coordinates = {
  latitude: 51.5074,
  longitude: -0.1278,
};

interface CachedLocation {
  coords: Coordinates;
  timestamp: number;
}

interface UseUserLocationResult {
  location: Coordinates | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  refresh: () => void;
}

// In-memory cache (persists across re-renders)
let cachedLocation: CachedLocation | null = null;

export function useUserLocation(): UseUserLocationResult {
  const [location, setLocation] = useState<Coordinates | null>(
    cachedLocation?.coords || null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const fetchLocation = useCallback(() => {
    // Check if we have a valid cached location
    if (cachedLocation && Date.now() - cachedLocation.timestamp < CACHE_DURATION_MS) {
      setLocation(cachedLocation.coords);
      setHasPermission(true);
      setIsLoading(false);
      return;
    }

    // Check if geolocation is available
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported');
      setLocation(DEFAULT_LOCATION);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        // Update cache
        cachedLocation = {
          coords,
          timestamp: Date.now(),
        };

        setLocation(coords);
        setHasPermission(true);
        setIsLoading(false);
      },
      (err) => {
        let errorMessage: string;
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            setHasPermission(false);
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable';
            break;
          case err.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'Unknown location error';
        }

        setError(errorMessage);
        // Use default location as fallback
        setLocation(DEFAULT_LOCATION);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: CACHE_DURATION_MS,
      }
    );
  }, []);

  // Fetch location on mount
  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // Refresh function to force re-fetch
  const refresh = useCallback(() => {
    cachedLocation = null;
    fetchLocation();
  }, [fetchLocation]);

  return {
    location,
    isLoading,
    error,
    hasPermission,
    refresh,
  };
}

// Export default location for cases where we need a fallback
export { DEFAULT_LOCATION };
