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

// Check if cache is valid
const isCacheValid = (): boolean =>
  !!cachedLocation && Date.now() - cachedLocation.timestamp < CACHE_DURATION_MS;

export function useUserLocation(): UseUserLocationResult {
  const [location, setLocation] = useState<Coordinates | null>(
    cachedLocation?.coords || null
  );
  // Start with isLoading=false if we have valid cache
  const [isLoading, setIsLoading] = useState(!isCacheValid());
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(isCacheValid());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch location on mount and when refresh is triggered
  useEffect(() => {
    let isMounted = true;
    let safetyTimeout: ReturnType<typeof setTimeout> | null = null;

    const fetchLocation = () => {
      // Check if we have a valid cached location
      if (cachedLocation && Date.now() - cachedLocation.timestamp < CACHE_DURATION_MS) {
        if (isMounted) {
          setLocation(cachedLocation.coords);
          setHasPermission(true);
          setIsLoading(false);
        }
        return;
      }

      // Check if geolocation is available
      if (!('geolocation' in navigator)) {
        if (isMounted) {
          setError('Geolocation not supported');
          setLocation(DEFAULT_LOCATION);
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setIsLoading(true);
        setError(null);
      }

      // Safety timeout in case geolocation API hangs
      let resolved = false;
      safetyTimeout = setTimeout(() => {
        if (!resolved && isMounted) {
          resolved = true;
          setError('Location request timed out');
          setLocation(DEFAULT_LOCATION);
          setIsLoading(false);
        }
      }, 15000); // 15s safety timeout (longer than the 10s API timeout)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (resolved || !isMounted) return;
          resolved = true;
          if (safetyTimeout) clearTimeout(safetyTimeout);

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
          if (resolved || !isMounted) return;
          resolved = true;
          if (safetyTimeout) clearTimeout(safetyTimeout);

          let errorMessage: string;
          let permissionDenied = false;
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              permissionDenied = true;
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

          if (permissionDenied) {
            setHasPermission(false);
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
    };

    fetchLocation();

    return () => {
      isMounted = false;
      if (safetyTimeout) clearTimeout(safetyTimeout);
    };
  }, [refreshTrigger]);

  // Refresh function to force re-fetch
  const refresh = useCallback(() => {
    cachedLocation = null;
    setRefreshTrigger((prev) => prev + 1);
  }, []);

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
