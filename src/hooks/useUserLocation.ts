// User location hook with a process-wide singleton store.
//
// Every caller of useUserLocation() subscribes to the SAME state via
// useSyncExternalStore, so calling refresh() from one component updates every
// consumer at once. Previously each call had its own React state and shared
// only a module-level cache var, which caused the filter sheet's "Enable
// location" button to look dead — one instance succeeded, the other never
// re-fetched.

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { supabase } from '../lib/supabase';
import type { Coordinates } from '../types';

const CACHE_DURATION_MS = 5 * 60 * 1000;

// Default location (Central London) — used as a soft fallback so the feed has
// something to compute distances against when GPS is denied.
const DEFAULT_LOCATION: Coordinates = {
  latitude: 51.5074,
  longitude: -0.1278,
};

type BrowserPermission = 'unknown' | 'prompt' | 'granted' | 'denied';

interface State {
  location: Coordinates | null;
  cachedAt: number;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  // Result of navigator.permissions.query — lets the UI tell "blocked at
  // browser level" apart from "haven't asked yet". Geolocation API itself
  // gives no way to distinguish these.
  permissionState: BrowserPermission;
}

let state: State = {
  location: null,
  cachedAt: 0,
  isLoading: false,
  error: null,
  hasPermission: false,
  permissionState: 'unknown',
};

const subscribers = new Set<() => void>();

function notify() {
  for (const s of subscribers) s();
}

function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  notify();
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

function getSnapshot(): State {
  return state;
}

function isCacheValid(): boolean {
  return !!state.location && Date.now() - state.cachedAt < CACHE_DURATION_MS;
}

let lastSyncedLocation: { lat: number; lng: number } | null = null;
let hasSyncedThisSession = false;

async function syncLocationToDb(coords: Coordinates) {
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

async function queryPermission(): Promise<BrowserPermission> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) return 'unknown';
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return status.state as BrowserPermission;
  } catch {
    return 'unknown';
  }
}

let inFlight = false;

async function fetchLocation() {
  if (inFlight) return;
  inFlight = true;

  if (isCacheValid()) {
    setState({ isLoading: false, hasPermission: true, error: null });
    inFlight = false;
    return;
  }

  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    setState({
      error: 'Geolocation not supported',
      location: DEFAULT_LOCATION,
      isLoading: false,
    });
    inFlight = false;
    return;
  }

  const permission = await queryPermission();

  // If the browser has persistently denied geolocation, getCurrentPosition
  // will fire the error callback immediately without re-prompting. There's
  // no recovery from here without the user changing browser settings — so
  // bail out with a clear message instead of pretending a retry will help.
  if (permission === 'denied') {
    setState({
      error: 'Location is blocked in your browser settings',
      location: DEFAULT_LOCATION,
      hasPermission: false,
      permissionState: 'denied',
      isLoading: false,
    });
    inFlight = false;
    return;
  }

  setState({ isLoading: true, error: null, permissionState: permission });

  let resolved = false;
  const safetyTimeout = setTimeout(() => {
    if (resolved) return;
    resolved = true;
    setState({
      error: 'Location request timed out',
      location: DEFAULT_LOCATION,
      isLoading: false,
    });
    inFlight = false;
  }, 15000);

  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(safetyTimeout);
      const coords: Coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setState({
        location: coords,
        cachedAt: Date.now(),
        hasPermission: true,
        permissionState: 'granted',
        isLoading: false,
        error: null,
      });
      if (!hasSyncedThisSession) {
        hasSyncedThisSession = true;
        syncLocationToDb(coords);
      }
      inFlight = false;
    },
    (err) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(safetyTimeout);
      let errorMessage: string;
      let permissionDenied = false;
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Location is blocked in your browser settings';
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
      setState({
        error: errorMessage,
        location: DEFAULT_LOCATION,
        hasPermission: false,
        permissionState: permissionDenied ? 'denied' : state.permissionState,
        isLoading: false,
      });
      inFlight = false;
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: CACHE_DURATION_MS,
    },
  );
}

// Returns a promise that resolves when the in-flight (or just-started) fetch
// settles. Lets callers await the outcome so they can show a toast etc.
function fetchLocationAwait(): Promise<State> {
  return new Promise((resolve) => {
    fetchLocation();
    // Resolve on the next state transition that ends the loading phase.
    const unsubscribe = subscribe(() => {
      if (!state.isLoading) {
        unsubscribe();
        resolve(state);
      }
    });
    // If the call short-circuited synchronously (e.g. cache hit), state is
    // already settled — resolve immediately.
    if (!state.isLoading) {
      unsubscribe();
      resolve(state);
    }
  });
}

interface UseUserLocationResult {
  location: Coordinates | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  permissionState: BrowserPermission;
  refresh: () => Promise<State>;
}

export function useUserLocation(): UseUserLocationResult {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!isCacheValid() && !state.isLoading) {
      fetchLocation();
    }
  }, []);

  const refresh = useCallback(() => {
    // Force a fresh fetch — clear the cached coords so isCacheValid returns
    // false and the next fetchLocation() actually hits the geolocation API.
    state = { ...state, cachedAt: 0 };
    return fetchLocationAwait();
  }, []);

  return {
    location: snapshot.location,
    isLoading: snapshot.isLoading,
    error: snapshot.error,
    hasPermission: snapshot.hasPermission,
    permissionState: snapshot.permissionState,
    refresh,
  };
}

export { DEFAULT_LOCATION };
