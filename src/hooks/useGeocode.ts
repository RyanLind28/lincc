import { useState, useCallback } from 'react';

interface GeocodeResult {
  lat: number;
  lng: number;
  name: string;
}

export function useGeocode() {
  const [isLoading, setIsLoading] = useState(false);

  const geocode = useCallback(async (query: string): Promise<GeocodeResult | null> => {
    if (!query.trim()) return null;
    setIsLoading(true);

    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1`
      );
      const data = await res.json();
      const feature = data.features?.[0];
      if (!feature) return null;

      return {
        lng: feature.center[0],
        lat: feature.center[1],
        name: feature.place_name,
      };
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { geocode, isLoading };
}
