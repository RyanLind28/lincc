// Reverse-geocode coordinates to a human-readable location name
// Uses OpenStreetMap Nominatim (free, no API key)

import { useState, useEffect } from 'react';
import type { Coordinates } from '../types';

export function useLocationName(location: Coordinates | null) {
  const [locationName, setLocationName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!location) return;

    let cancelled = false;
    setIsLoading(true);

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${location.latitude}&lon=${location.longitude}&format=json&zoom=10`,
      { headers: { 'User-Agent': 'Lincc/0.1.0' } }
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const addr = data.address;
        if (addr) {
          const city = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || '';
          const state = addr.state || addr.region || '';
          const country = addr.country || '';
          const parts = [city, state, country].filter(Boolean);
          setLocationName(parts.join(', ') || data.display_name || null);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [location]);

  return { locationName, isLoading };
}
