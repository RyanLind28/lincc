import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useNavigate } from 'react-router-dom';
import { Locate } from 'lucide-react';
import type { Coordinates } from '../../types';

// Set access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

export interface MapEvent {
  id: string;
  title: string;
  venue_name: string;
  venue_lat: number;
  venue_lng: number;
  category: {
    name: string;
    icon: string;
  };
  start_time: string;
  participant_count: number;
  capacity: number;
}

export interface MapViewProps {
  events: MapEvent[];
  userLocation: Coordinates | null;
  onRecenter?: () => void;
  className?: string;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function MapView({ events, userLocation, className }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const navigate = useNavigate();

  // Default center (London) if no user location
  const defaultCenter: [number, number] = [-0.1278, 51.5074];

  // Find me / recenter on user location
  const handleFindMe = useCallback(() => {
    if (!map.current || !isLoaded) return;

    if (userLocation) {
      // Fly to user location with closer zoom
      setIsLocating(true);
      map.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 15,
        duration: 1000,
      });
      setTimeout(() => setIsLocating(false), 1000);
    } else {
      // Request location from browser
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.current?.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 15,
            duration: 1000,
          });
          setTimeout(() => setIsLocating(false), 1000);
        },
        () => {
          setIsLocating(false);
          // Location denied or unavailable - stay on current view
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [userLocation, isLoaded]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const center: [number, number] = userLocation
      ? [userLocation.longitude, userLocation.latitude]
      : defaultCenter;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center,
      zoom: 13,
      attributionControl: false,
    });

    // Add minimal attribution
    map.current.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-left'
    );

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'bottom-right'
    );

    map.current.on('load', () => {
      setIsLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update center when user location changes
  useEffect(() => {
    if (!map.current || !userLocation || !isLoaded) return;

    map.current.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 13,
      duration: 1000,
    });
  }, [userLocation, isLoaded]);

  // Add/update markers when events change
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    events.forEach((event) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'event-marker';
      el.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-purple flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform border-2 border-white">
          <span class="text-white text-lg">${getEmojiForCategory(event.category.icon)}</span>
        </div>
      `;

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        maxWidth: '280px',
      }).setHTML(`
        <div class="p-3 cursor-pointer" id="popup-${event.id}">
          <div class="font-semibold text-gray-900 text-sm mb-1">${event.title}</div>
          <div class="text-xs text-gray-500 mb-1">${event.venue_name}</div>
          <div class="flex items-center justify-between text-xs">
            <span class="text-coral font-medium">${formatTime(event.start_time)}</span>
            <span class="text-gray-400">${event.participant_count + 1}/${event.capacity + 1}</span>
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([event.venue_lng, event.venue_lat])
        .setPopup(popup)
        .addTo(map.current!);

      // Navigate on popup click
      popup.on('open', () => {
        const popupEl = document.getElementById(`popup-${event.id}`);
        if (popupEl) {
          popupEl.addEventListener('click', () => {
            navigate(`/event/${event.id}`);
          });
        }
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers if there are events
    if (events.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();

      // Include user location in bounds
      if (userLocation) {
        bounds.extend([userLocation.longitude, userLocation.latitude]);
      }

      // Include all events
      events.forEach((event) => {
        bounds.extend([event.venue_lng, event.venue_lat]);
      });

      map.current.fitBounds(bounds, {
        padding: 60,
        maxZoom: 15,
        duration: 500,
      });
    }
  }, [events, isLoaded, navigate]);

  // Add user location marker
  useEffect(() => {
    if (!map.current || !userLocation || !isLoaded) return;

    // Create user marker
    const userEl = document.createElement('div');
    userEl.innerHTML = `
      <div class="relative">
        <div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>
        <div class="absolute inset-0 w-4 h-4 rounded-full bg-blue-500 animate-ping opacity-75"></div>
      </div>
    `;

    const userMarker = new mapboxgl.Marker({ element: userEl })
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .addTo(map.current);

    return () => {
      userMarker.remove();
    };
  }, [userLocation, isLoaded]);

  return (
    <div className={className}>
      <div ref={mapContainer} className="w-full h-full" />

      {/* Find Me button */}
      {isLoaded && (
        <button
          onClick={handleFindMe}
          disabled={isLocating}
          className="absolute bottom-28 right-2 z-10 w-10 h-10 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
          aria-label="Find my location"
        >
          <Locate
            className={`h-5 w-5 text-gray-700 ${isLocating ? 'animate-pulse text-coral' : ''}`}
          />
        </button>
      )}

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}

// Helper to get emoji for category icons
function getEmojiForCategory(icon: string): string {
  const emojiMap: Record<string, string> = {
    coffee: '☕',
    utensils: '🍽️',
    wine: '🍷',
    beer: '🍺',
    dumbbell: '💪',
    bike: '🚴',
    gamepad: '🎮',
    music: '🎵',
    palette: '🎨',
    book: '📚',
    briefcase: '💼',
    heart: '❤️',
    users: '👥',
    camera: '📷',
    film: '🎬',
    'map-pin': '📍',
    star: '⭐',
    default: '📍',
  };
  return emojiMap[icon] || emojiMap.default;
}

export default MapView;
