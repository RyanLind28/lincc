import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useNavigate } from 'react-router-dom';
import { Locate, Clock, Users, MapPin } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';
import type { Coordinates } from '../../types';

// Set access token
const token = import.meta.env.VITE_MAPBOX_TOKEN;
if (!token) {
  console.warn('[MapView] VITE_MAPBOX_TOKEN is not set — map tiles will not load');
}
mapboxgl.accessToken = token || '';

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
  radiusKm?: number;
  onEventSelect?: (eventId: string) => void;
  className?: string;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 0) return 'Started';
  if (diffMins < 60) return `In ${diffMins}m`;
  if (diffMins < 1440) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Generate a GeoJSON circle for the radius overlay
function createGeoJSONCircle(center: [number, number], radiusKm: number, points = 64): GeoJSON.Feature {
  const coords: [number, number][] = [];
  const distanceX = radiusKm / (111.32 * Math.cos((center[1] * Math.PI) / 180));
  const distanceY = radiusKm / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([center[0] + x, center[1] + y]);
  }
  coords.push(coords[0]); // close ring

  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  };
}

// Convert events to GeoJSON for clustering
function eventsToGeoJSON(events: MapEvent[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: events.map((event) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [event.venue_lng, event.venue_lat],
      },
      properties: {
        id: event.id,
        title: event.title,
        venue_name: event.venue_name,
        category_name: event.category.name,
        category_icon: event.category.icon,
        start_time: event.start_time,
        participant_count: event.participant_count,
        capacity: event.capacity,
        emoji: getEmojiForCategory(event.category.icon),
      },
    })),
  };
}

export function MapView({ events, userLocation, radiusKm, className }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Default center (London) if no user location
  const defaultCenter: [number, number] = [-0.1278, 51.5074];

  // Find me / recenter on user location
  const handleFindMe = useCallback(() => {
    if (!map.current || !isLoaded) return;

    if (userLocation) {
      setIsLocating(true);
      map.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 15,
        duration: 1000,
      });
      setTimeout(() => setIsLocating(false), 1000);
    } else {
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
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [userLocation, isLoaded]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Clean up any existing map (handles React StrictMode double-mount)
    if (map.current) {
      map.current.remove();
      map.current = null;
      setIsLoaded(false);
    }

    const center: [number, number] = userLocation
      ? [userLocation.longitude, userLocation.latitude]
      : defaultCenter;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center,
      zoom: 13,
      attributionControl: false,
    });

    map.current = m;

    m.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-left'
    );

    m.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'bottom-right'
    );

    m.on('load', () => {
      // Force resize to ensure canvas matches container after layout settles
      m.resize();
      setIsLoaded(true);
    });

    // Also resize after a short delay to handle late layout shifts
    const resizeTimer = setTimeout(() => {
      if (map.current) map.current.resize();
    }, 200);

    return () => {
      clearTimeout(resizeTimer);
      m.remove();
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

  // Add user location marker
  useEffect(() => {
    if (!map.current || !userLocation || !isLoaded) return;

    const userEl = document.createElement('div');
    userEl.innerHTML = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 rounded-full bg-blue-500/20 animate-ping"></div>
        <div class="absolute w-5 h-5 rounded-full bg-blue-500/15"></div>
        <div class="relative w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>
      </div>
    `;

    const userMarker = new mapboxgl.Marker({ element: userEl })
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .addTo(map.current);

    return () => {
      userMarker.remove();
    };
  }, [userLocation, isLoaded]);

  // Radius circle
  useEffect(() => {
    if (!map.current || !isLoaded || !userLocation || !radiusKm) return;

    const sourceId = 'radius-circle';
    const fillId = 'radius-fill';
    const strokeId = 'radius-stroke';
    const m = map.current;

    const circleGeoJSON = createGeoJSONCircle(
      [userLocation.longitude, userLocation.latitude],
      radiusKm
    );

    if (m.getSource(sourceId)) {
      (m.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(circleGeoJSON as any);
    } else {
      m.addSource(sourceId, {
        type: 'geojson',
        data: circleGeoJSON as any,
      });

      m.addLayer({
        id: fillId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#845EF7',
          'fill-opacity': 0.06,
        },
      });

      m.addLayer({
        id: strokeId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#845EF7',
          'line-width': 1.5,
          'line-opacity': 0.3,
          'line-dasharray': [4, 4],
        },
      });
    }

    return () => {
      // Layers cleaned up on unmount via map.remove()
    };
  }, [userLocation, radiusKm, isLoaded]);

  // Clustered event markers
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    const m = map.current;
    const sourceId = 'events-source';

    const geojson = eventsToGeoJSON(events);

    // Update existing source or create new one
    if (m.getSource(sourceId)) {
      (m.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(geojson);
    } else {
      m.addSource(sourceId, {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Cluster circles
      m.addLayer({
        id: 'clusters',
        type: 'circle',
        source: sourceId,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#845EF7',  // purple for small clusters
            5,
            '#FF6B6B',  // coral for medium
            15,
            '#E64545',  // darker coral for large
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,   // small
            5, 25, // medium
            15, 32, // large
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Cluster count labels
      m.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: sourceId,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 13,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // Individual event markers (unclustered)
      m.addLayer({
        id: 'unclustered-point',
        type: 'symbol',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['get', 'emoji'],
          'text-size': 22,
          'text-allow-overlap': true,
        },
      });

      // Click cluster to zoom in
      m.on('click', 'clusters', (e) => {
        const features = m.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id;
        (m.getSource(sourceId) as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err || zoom == null) return;
            const geometry = features[0].geometry;
            if (geometry.type !== 'Point') return;
            m.easeTo({
              center: geometry.coordinates as [number, number],
              zoom,
            });
          }
        );
      });

      // Click unclustered marker to show preview
      m.on('click', 'unclustered-point', (e) => {
        const features = m.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
        if (!features.length) return;
        const props = features[0].properties;
        if (!props) return;

        const event = events.find((ev) => ev.id === props.id);
        if (event) {
          setSelectedEvent(event);
        }
      });

      // Pointer cursor on interactive layers
      m.on('mouseenter', 'clusters', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'clusters', () => { m.getCanvas().style.cursor = ''; });
      m.on('mouseenter', 'unclustered-point', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'unclustered-point', () => { m.getCanvas().style.cursor = ''; });
    }

    // Fit bounds to show all markers
    if (events.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      if (userLocation) {
        bounds.extend([userLocation.longitude, userLocation.latitude]);
      }
      events.forEach((event) => {
        bounds.extend([event.venue_lng, event.venue_lat]);
      });
      m.fitBounds(bounds, {
        padding: 60,
        maxZoom: 15,
        duration: 500,
      });
    }
  }, [events, isLoaded, userLocation]);

  // Close preview when clicking the map background
  useEffect(() => {
    if (!map.current || !isLoaded) return;
    const m = map.current;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const features = m.queryRenderedFeatures(e.point, {
        layers: ['clusters', 'unclustered-point'],
      });
      if (features.length === 0) {
        setSelectedEvent(null);
      }
    };

    m.on('click', handleClick);
    return () => {
      m.off('click', handleClick);
    };
  }, [isLoaded]);

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

      {/* Event Preview Card */}
      {selectedEvent && (
        <div
          ref={previewRef}
          className="absolute bottom-20 left-3 right-3 z-20 animate-slide-up"
        >
          <EventPreviewCard
            event={selectedEvent}
            onTap={() => navigate(`/event/${selectedEvent.id}`)}
            onClose={() => setSelectedEvent(null)}
          />
        </div>
      )}

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}

// Event Preview Card shown when tapping a marker
function EventPreviewCard({
  event,
  onTap,
  onClose,
}: {
  event: MapEvent;
  onTap: () => void;
  onClose: () => void;
}) {
  const spotsLeft = event.capacity - event.participant_count;

  return (
    <div
      onClick={onTap}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="flex gap-3">
        {/* Category icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral to-purple flex items-center justify-center flex-shrink-0">
          <CategoryIcon icon={event.category.icon} size="lg" className="text-white" />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{event.title}</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0 -mt-0.5"
            >
              &times;
            </button>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{event.venue_name}</span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs font-medium text-coral">
              <Clock className="h-3 w-3" />
              {formatTime(event.start_time)}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="h-3 w-3" />
              {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left` : 'Full'}
            </div>
            <span className="ml-auto text-[10px] font-medium text-purple bg-purple/10 px-2 py-0.5 rounded-full">
              {event.category.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to get emoji for category icons
function getEmojiForCategory(icon: string): string {
  const emojiMap: Record<string, string> = {
    Coffee: '☕',
    Utensils: '🍽️',
    Wine: '🍷',
    Beer: '🍺',
    Dumbbell: '💪',
    Trophy: '🏆',
    TreePine: '🌲',
    Heart: '❤️',
    Film: '🎬',
    Gamepad2: '🎮',
    Palette: '🎨',
    BookOpen: '📚',
    PartyPopper: '🎉',
    Dog: '🐕',
    // Lowercase fallbacks
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
  };
  return emojiMap[icon] || '📍';
}

export default MapView;
