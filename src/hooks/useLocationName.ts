// Reverse-geocode coordinates to a human-readable location name
// Uses OpenStreetMap Nominatim (free, no API key required)

import { useState, useEffect } from 'react';
import type { Coordinates } from '../types';

export function useLocationName(location: Coordinates | null) {
  const [locationName, setLocationName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!location) return;

    let cancelled = false;
    setIsLoading(true);

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${location.latitude}&lon=${location.longitude}&format=json&zoom=14&addressdetails=1`;

    fetch(url, { headers: { 'User-Agent': 'Lincc/0.11.0' } })
      .then((res) => {
        if (!res.ok) throw new Error(`Nominatim returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;

        const addr = data.address;
        if (addr) {
          const locality = addr.village || addr.suburb || addr.hamlet || addr.town || addr.city || '';
          const county = addr.county || '';
          const state = addr.state || addr.region || '';
          const parts = [locality, county, state].filter(Boolean);
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
