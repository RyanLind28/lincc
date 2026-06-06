import { logger } from '../lib/utils';
// Google Places API service
// Uses the Google Maps JavaScript SDK — Places API (New)
// AutocompleteSuggestion + Place classes (replaces legacy AutocompleteService)
// Session tokens group autocomplete + detail calls into single billing sessions

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

// --- Types ---

export interface PlacePrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

export interface PlaceDetails {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  userRatingCount?: number;
  photos: PlacePhoto[];
  openingHours?: string[];
  websiteUri?: string;
  googleMapsUri?: string;
}

export interface PlacePhoto {
  name: string; // Full photo URL
  widthPx: number;
  heightPx: number;
}

// --- Google Maps JS API Loader ---

let loadPromise: Promise<void> | null = null;

function loadGoogleMapsApi(): Promise<void> {
  if (window.google?.maps?.places) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    // Check if script is already in DOM (e.g. from another component)
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const check = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Wait for places library to be available
      const check = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Google Maps API'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

// --- Session Token Management ---
// Groups autocomplete keystrokes + final detail fetch into one billing session

let currentSessionToken: google.maps.places.AutocompleteSessionToken | null = null;

function getSessionToken(): google.maps.places.AutocompleteSessionToken {
  if (!currentSessionToken) {
    currentSessionToken = new google.maps.places.AutocompleteSessionToken();
  }
  return currentSessionToken;
}

function resetSessionToken(): void {
  currentSessionToken = null;
}

// --- Autocomplete (New API) ---

export async function searchPlaces(
  query: string,
  location?: { lat: number; lng: number },
  regionCodes?: string[],
): Promise<PlacePrediction[]> {
  if (!API_KEY || !query.trim() || query.trim().length < 2) {
    if (!API_KEY && import.meta.env.DEV) console.warn('[Places] No API key found');
    return [];
  }

  try {
    await loadGoogleMapsApi();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const placesLib = google.maps.places as any;

    // Use new AutocompleteSuggestion API
    if (placesLib.AutocompleteSuggestion) {
      const request: Record<string, unknown> = {
        input: query,
        sessionToken: getSessionToken(),
      };

      if (location) {
        request.locationBias = {
          center: { lat: location.lat, lng: location.lng },
          radius: 50000,
        };
      }

      // Hard filter to ISO 3166-1 alpha-2 country codes. This is what stops
      // "Coffee" returning Bangladesh / NYC results when the user is in the UK:
      // locationBias is only a soft hint, but includedRegionCodes is a hard
      // restriction. Max 15 codes per the New Places API.
      if (regionCodes && regionCodes.length > 0) {
        request.includedRegionCodes = regionCodes.slice(0, 15).map((c) => c.toLowerCase());
      }

      const { suggestions } = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

      return (suggestions || [])
        .filter((s: any) => s.placePrediction)
        .map((s: any) => ({
          placeId: s.placePrediction.placeId,
          mainText: s.placePrediction.mainText?.text || '',
          secondaryText: s.placePrediction.secondaryText?.text || '',
          description: s.placePrediction.text?.text || '',
        }));
    }

    // Fallback to legacy AutocompleteService if new API not available
    const service = new google.maps.places.AutocompleteService();
    const request: google.maps.places.AutocompletionRequest = {
      input: query,
      sessionToken: getSessionToken(),
    };

    if (location) {
      request.locationBias = {
        center: { lat: location.lat, lng: location.lng },
        radius: 50000,
      };
    }

    // Legacy API uses componentRestrictions.country (max 5).
    if (regionCodes && regionCodes.length > 0) {
      request.componentRestrictions = { country: regionCodes.slice(0, 5).map((c) => c.toLowerCase()) };
    }

    const response = await service.getPlacePredictions(request);
    return (response.predictions || []).map((p: google.maps.places.AutocompletePrediction) => ({
      placeId: p.place_id,
      mainText: p.structured_formatting?.main_text || '',
      secondaryText: p.structured_formatting?.secondary_text || '',
      description: p.description || '',
    }));
  } catch (err) {
    logger.error('Places autocomplete failed:', err);
    return [];
  }
}

// --- Place Details (New API) ---

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!API_KEY || !placeId) return null;

  try {
    await loadGoogleMapsApi();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const placesLib = google.maps.places as any;

    // Use new Place class
    if (placesLib.Place) {
      const place = new placesLib.Place({ id: placeId });

      await place.fetchFields({
        fields: [
          'id',
          'displayName',
          'formattedAddress',
          'location',
          'rating',
          'userRatingCount',
          'photos',
          'regularOpeningHours',
          'websiteURI',
          'googleMapsURI',
        ],
        sessionToken: getSessionToken(),
      });

      resetSessionToken();

      const photos: PlacePhoto[] = (place.photos || []).slice(0, 5).map((photo: any) => ({
        name: photo.getURI ? photo.getURI({ maxWidth: 800, maxHeight: 600 }) : '',
        widthPx: photo.widthPx || 800,
        heightPx: photo.heightPx || 600,
      }));

      return {
        id: place.id || placeId,
        name: place.displayName || '',
        address: place.formattedAddress || '',
        lat: place.location?.lat() || 0,
        lng: place.location?.lng() || 0,
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        photos,
        openingHours: place.regularOpeningHours?.weekdayDescriptions,
        websiteUri: place.websiteURI,
        googleMapsUri: place.googleMapsURI,
      };
    }

    // Fallback to legacy PlacesService
    const div = document.createElement('div');
    const service = new google.maps.places.PlacesService(div);

    return new Promise((resolve) => {
      service.getDetails(
        {
          placeId,
          fields: [
            'place_id',
            'name',
            'formatted_address',
            'geometry',
            'rating',
            'user_ratings_total',
            'photos',
            'opening_hours',
            'website',
            'url',
          ],
          sessionToken: getSessionToken(),
        },
        (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
          resetSessionToken();

          if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
            logger.error('Places detail error:', status);
            resolve(null);
            return;
          }

          resolve({
            id: place.place_id || placeId,
            name: place.name || '',
            address: place.formatted_address || '',
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
            rating: place.rating,
            userRatingCount: place.user_ratings_total,
            photos: (place.photos || []).slice(0, 5).map((photo: google.maps.places.PlacePhoto) => ({
              name: photo.getUrl({ maxWidth: 800, maxHeight: 600 }),
              widthPx: photo.width,
              heightPx: photo.height,
            })),
            openingHours: place.opening_hours?.weekday_text,
            websiteUri: place.website,
            googleMapsUri: place.url,
          });
        },
      );
    });
  } catch (err) {
    logger.error('Places detail failed:', err);
    resetSessionToken();
    return null;
  }
}

// --- Photo URL ---
// Photo URLs are already full URLs from getURI() / getUrl().

export function getPlacePhotoUrl(
  photoNameOrUrl: string,
  _maxWidth = 800,
  _maxHeight = 600,
): string {
  if (!photoNameOrUrl) return '';
  return photoNameOrUrl;
}

// --- Country code (for includedRegionCodes) ---
//
// Resolves the user's ISO 3166-1 alpha-2 country code from lat/lng. Used to
// hard-restrict Places autocomplete to the user's country so the New API
// stops surfacing globally-popular irrelevant matches (e.g. NYC coffee when
// you're in the UK).
//
// Strategy:
//   1. Bucket the lat/lng to ~1° (~111 km) so two nearby calls share a cache
//      entry — country boundaries are coarse enough that this is safe.
//   2. localStorage cache keyed by the bucket. Country code virtually never
//      changes for a given lat/lng so we cache for 30 days.
//   3. Reverse-geocode via the Google JS SDK Geocoder (cheap, runs in the
//      same billing session as the autocomplete call).
//   4. On any failure, fall back to navigator.language (e.g. 'en-GB' → 'GB').

// v2 prefix: invalidates old entries from before we knew the location might
// have been the London fallback (GB cached for 30d on anyone whose GPS failed).
const COUNTRY_CACHE_PREFIX = 'lincc:places:country:v2:';
const COUNTRY_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function bucketKey(lat: number, lng: number): string {
  return `${COUNTRY_CACHE_PREFIX}${Math.round(lat)},${Math.round(lng)}`;
}

function localeCountryFallback(): string | null {
  try {
    const lang = navigator.language || (navigator.languages && navigator.languages[0]);
    if (!lang) return null;
    const parts = lang.split('-');
    if (parts.length < 2) return null;
    const cc = parts[1].toUpperCase();
    return /^[A-Z]{2}$/.test(cc) ? cc : null;
  } catch {
    return null;
  }
}

const inFlight = new Map<string, Promise<string | null>>();

export async function getUserCountryCode(location: { lat: number; lng: number } | null | undefined): Promise<string | null> {
  if (!location) return localeCountryFallback();
  const key = bucketKey(location.lat, location.lng);

  // Cache hit
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const { code, at } = JSON.parse(raw) as { code: string; at: number };
      if (code && Date.now() - at < COUNTRY_CACHE_TTL_MS) return code;
    }
  } catch {
    // Corrupt or unavailable storage — fall through
  }

  if (!API_KEY) return localeCountryFallback();

  // Deduplicate in-flight requests for the same bucket
  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = (async (): Promise<string | null> => {
    try {
      await loadGoogleMapsApi();
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat: location.lat, lng: location.lng } });
      const results = response.results || [];
      for (const result of results) {
        for (const component of result.address_components || []) {
          if (component.types.includes('country') && component.short_name) {
            const code = component.short_name.toUpperCase();
            try {
              localStorage.setItem(key, JSON.stringify({ code, at: Date.now() }));
            } catch { /* quota — fine */ }
            return code;
          }
        }
      }
      return localeCountryFallback();
    } catch (err) {
      logger.error('getUserCountryCode failed:', err);
      return localeCountryFallback();
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}
