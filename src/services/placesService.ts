// Google Places API (New) service
// Uses session tokens to group autocomplete + detail calls into single billing sessions
// Field masking to only request what we need (reduces cost per call)

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
const BASE_URL = 'https://places.googleapis.com/v1';

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
  name: string; // e.g. "places/PLACE_ID/photos/PHOTO_REF"
  widthPx: number;
  heightPx: number;
}

// --- Session Token Management ---
// Groups autocomplete keystrokes + final detail fetch into one billing session (~$0.017)

let currentSessionToken: string | null = null;

function getSessionToken(): string {
  if (!currentSessionToken) {
    currentSessionToken = crypto.randomUUID();
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

  const body: Record<string, unknown> = {
    input: query,
    sessionToken: getSessionToken(),
    languageCode: 'en',
  };

  // Bias results toward user's current location (50km radius)
  if (location) {
    body.locationBias = {
      circle: {
        center: { latitude: location.lat, longitude: location.lng },
        radius: 50000,
      },
    };
  }

  try {
    const res = await fetch(`${BASE_URL}/places:autocomplete?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error('Places autocomplete error:', res.status, await res.text());
      return [];
    }

    const data = await res.json();

    return (data.suggestions || [])
      .filter((s: Record<string, unknown>) => s.placePrediction)
      .map((s: { placePrediction: Record<string, unknown> }) => {
        const p = s.placePrediction;
        const structured = p.structuredFormat as {
          mainText?: { text?: string };
          secondaryText?: { text?: string };
        } | undefined;
        return {
          placeId: (p.placeId || p.place_id || '') as string,
          mainText: structured?.mainText?.text || '',
          secondaryText: structured?.secondaryText?.text || '',
          description: (p.text as { text?: string })?.text || '',
        };
      });
  } catch (err) {
    console.error('Places autocomplete failed:', err);
    return [];
  }
}

// --- Place Details ---
// Uses field mask to only fetch what we need (keeps cost low)

const DETAIL_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'photos',
  'currentOpeningHours',
  'websiteUri',
  'googleMapsUri',
].join(',');

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!API_KEY || !placeId) return null;

  try {
    // Pass session token as query param (not header) to avoid CORS preflight issues
    const sessionParam = currentSessionToken ? `&sessionToken=${currentSessionToken}` : '';
    const res = await fetch(
      `${BASE_URL}/places/${placeId}?key=${API_KEY}${sessionParam}`,
      {
        headers: {
          'X-Goog-FieldMask': DETAIL_FIELDS,
        },
      },
    );

    // Reset session after detail fetch (session is now closed)
    resetSessionToken();

    if (!res.ok) {
      console.error('Places detail error:', res.status, await res.text());
      return null;
    }

    const place = await res.json();

    return {
      id: place.id || placeId,
      name: place.displayName?.text || '',
      address: place.formattedAddress || '',
      lat: place.location?.latitude || 0,
      lng: place.location?.longitude || 0,
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      photos: (place.photos || []).slice(0, 5).map((p: Record<string, unknown>) => ({
        name: p.name as string,
        widthPx: p.widthPx as number,
        heightPx: p.heightPx as number,
      })),
      openingHours: place.currentOpeningHours?.weekdayDescriptions,
      websiteUri: place.websiteUri,
      googleMapsUri: place.googleMapsUri,
    };
  } catch (err) {
    console.error('Places detail failed:', err);
    resetSessionToken();
    return null;
  }
}

// --- Photo URL ---
// Returns a URL for a place photo at the given max dimensions

export function getPlacePhotoUrl(
  photoName: string,
  maxWidth = 800,
  maxHeight = 600,
): string {
  if (!API_KEY || !photoName) return '';
  return `${BASE_URL}/${photoName}/media?maxWidthPx=${maxWidth}&maxHeightPx=${maxHeight}&key=${API_KEY}`;
}
