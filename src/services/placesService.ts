// Google Places API service
// Uses the Google Maps JavaScript SDK (Places library) for browser-compatible autocomplete
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
  name: string; // Full photo URL (from JS API getUrl())
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
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

// --- Autocomplete ---

export async function searchPlaces(
  query: string,
  location?: { lat: number; lng: number },
): Promise<PlacePrediction[]> {
  if (!API_KEY || !query.trim() || query.trim().length < 2) return [];

  try {
    await loadGoogleMapsApi();

    const service = new google.maps.places.AutocompleteService();

    const request: google.maps.places.AutocompletionRequest = {
      input: query,
      sessionToken: getSessionToken(),
    };

    // Bias results toward user's current location (50km radius)
    if (location) {
      request.locationBias = new google.maps.Circle({
        center: { lat: location.lat, lng: location.lng },
        radius: 50000,
      });
    }

    const response = await service.getPlacePredictions(request);

    return (response.predictions || []).map((p) => ({
      placeId: p.place_id,
      mainText: p.structured_formatting?.main_text || '',
      secondaryText: p.structured_formatting?.secondary_text || '',
      description: p.description || '',
    }));
  } catch (err) {
    console.error('Places autocomplete failed:', err);
    return [];
  }
}

// --- Place Details ---

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!API_KEY || !placeId) return null;

  try {
    await loadGoogleMapsApi();

    // PlacesService requires a DOM element
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
        (place, status) => {
          resetSessionToken();

          if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
            console.error('Places detail error:', status);
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
            photos: (place.photos || []).slice(0, 5).map((photo) => ({
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
    console.error('Places detail failed:', err);
    resetSessionToken();
    return null;
  }
}

// --- Photo URL ---
// With the JS API, photo URLs are already full URLs stored in the name field.
// This function returns the URL directly, or constructs a resized variant.

export function getPlacePhotoUrl(
  photoNameOrUrl: string,
  _maxWidth = 800,
  _maxHeight = 600,
): string {
  if (!photoNameOrUrl) return '';
  // JS API photo URLs are already complete — return as-is
  return photoNameOrUrl;
}
