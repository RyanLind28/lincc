// User location hook with caching
// Wraps Geolocation API with 5-minute cache and graceful error handling
// Also syncs location to DB for nearby event alerts

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
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

// Track last synced location to avoid redundant DB writes
let lastSyncedLocation: { lat: number; lng: number } | null = null;

async function syncLocationToDb(coords: Coordinates) {
  // Only sync if location has changed meaningfully (> ~100m)
  if (
    lastSyncedLocation &&
    Math.abs(lastSyncedLocation.lat - coords.latitude) < 0.001 &&
    Math.abs(lastSyncedLocation.lng - coords.longitude) < 0.001
  ) {
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('profiles')
    .update({ last_lat: coords.latitude, last_lng: coords.longitude })
    .eq('id', user.id);

  if (!error) {
    lastSyncedLocation = { lat: coords.latitude, lng: coords.longitude };
  }
}

export function useUserLocation(): UseUserLocationResult {
  const [location, setLocation] = useState<Coordinates | null>(
    cachedLocation?.coords || null
  );
  // Start with isLoading=false if we have valid cache
  const [isLoading, setIsLoading] = useState(!isCacheValid());
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(isCacheValid());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const hasSyncedRef = useRef(false);

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

          // Sync to DB for nearby event alerts (once per session)
          if (!hasSyncedRef.current) {
            hasSyncedRef.current = true;
            syncLocationToDb(coords);
          }
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
