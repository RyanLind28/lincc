// Demo events for development mode
// These events have coordinates for proper distance calculations

export interface DemoEvent {
  id: string;
  title: string;
  category_value: string; // Maps to CATEGORIES value
  category: {
    name: string;
    icon: string;
    image: string;
  };
  subcategory?: string;
  host: {
    first_name: string;
    avatar_url: string | null;
  };
  venue_name: string;
  venue_short: string;
  venue_lat: number;
  venue_lng: number;
  start_time: string;
  capacity: number;
  participant_count: number;
  audience: 'everyone' | 'women' | 'men';
  status: 'active' | 'full' | 'expired' | 'cancelled';
}

// London coordinates for demo events
// User location assumed around Central London (51.5074, -0.1278)
export const DEMO_EVENTS: DemoEvent[] = [
  {
    id: '1',
    title: 'Morning Coffee Chat',
    category_value: 'coffee',
    category: {
      name: 'Coffee',
      icon: 'Coffee',
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
    },
    subcategory: 'Casual chat',
    host: { first_name: 'Sarah', avatar_url: null },
    venue_name: 'Blue Bottle Coffee',
    venue_short: 'Shoreditch',
    venue_lat: 51.5246,
    venue_lng: -0.0780,
    start_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    capacity: 2,
    participant_count: 1,
    audience: 'everyone',
    status: 'active',
  },
  {
    id: '2',
    title: 'Morning Yoga in the Park',
    category_value: 'wellness',
    category: {
      name: 'Wellness',
      icon: 'Heart',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
    },
    subcategory: 'Yoga',
    host: { first_name: 'Emma', avatar_url: null },
    venue_name: 'Victoria Park',
    venue_short: 'Hackney',
    venue_lat: 51.5362,
    venue_lng: -0.0356,
    start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    capacity: 6,
    participant_count: 3,
    audience: 'everyone',
    status: 'active',
  },
  {
    id: '3',
    title: 'Sunset Hike to the Viewpoint',
    category_value: 'outdoors',
    category: {
      name: 'Outdoors',
      icon: 'TreePine',
      image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=400&h=300&fit=crop',
    },
    subcategory: 'Hiking',
    host: { first_name: 'Alex', avatar_url: null },
    venue_name: 'Hampstead Heath',
    venue_short: 'Hampstead',
    venue_lat: 51.5637,
    venue_lng: -0.1600,
    start_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    capacity: 8,
    participant_count: 4,
    audience: 'everyone',
    status: 'active',
  },
  {
    id: '4',
    title: 'Board Games & Beers',
    category_value: 'gaming',
    category: {
      name: 'Gaming',
      icon: 'Gamepad2',
      image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400&h=300&fit=crop',
    },
    subcategory: 'Board games',
    host: { first_name: 'Mike', avatar_url: null },
    venue_name: 'The Game Parlour',
    venue_short: 'Islington',
    venue_lat: 51.5362,
    venue_lng: -0.1033,
    start_time: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    capacity: 5,
    participant_count: 2,
    audience: 'everyone',
    status: 'active',
  },
  {
    id: '5',
    title: 'Tennis Doubles Match',
    category_value: 'sports',
    category: {
      name: 'Sports',
      icon: 'Trophy',
      image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400&h=300&fit=crop',
    },
    subcategory: 'Tennis',
    host: { first_name: 'James', avatar_url: null },
    venue_name: "Regent's Park Courts",
    venue_short: 'Camden',
    venue_lat: 51.5313,
    venue_lng: -0.1570,
    start_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    capacity: 3,
    participant_count: 1,
    audience: 'everyone',
    status: 'active',
  },
  {
    id: '6',
    title: 'Brunch at the New Place',
    category_value: 'food',
    category: {
      name: 'Food & Drinks',
      icon: 'Utensils',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
    },
    subcategory: 'Brunch',
    host: { first_name: 'Lucy', avatar_url: null },
    venue_name: 'The Breakfast Club',
    venue_short: 'Soho',
    venue_lat: 51.5130,
    venue_lng: -0.1340,
    start_time: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
    capacity: 4,
    participant_count: 2,
    audience: 'everyone',
    status: 'active',
  },
  {
    id: '7',
    title: 'Women-only Pilates Session',
    category_value: 'wellness',
    category: {
      name: 'Wellness',
      icon: 'Heart',
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
    },
    subcategory: 'Pilates',
    host: { first_name: 'Sophie', avatar_url: null },
    venue_name: 'Frame Shoreditch',
    venue_short: 'Shoreditch',
    venue_lat: 51.5242,
    venue_lng: -0.0800,
    start_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    capacity: 8,
    participant_count: 5,
    audience: 'women',
    status: 'active',
  },
  {
    id: '8',
    title: 'Evening Run Club',
    category_value: 'fitness',
    category: {
      name: 'Fitness',
      icon: 'Dumbbell',
      image: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=400&h=300&fit=crop',
    },
    subcategory: 'Running',
    host: { first_name: 'David', avatar_url: null },
    venue_name: 'Hyde Park Corner',
    venue_short: 'Mayfair',
    venue_lat: 51.5032,
    venue_lng: -0.1506,
    start_time: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
    capacity: 10,
    participant_count: 6,
    audience: 'everyone',
    status: 'active',
  },
  {
    id: '9',
    title: 'Photography Walk',
    category_value: 'creative',
    category: {
      name: 'Creative',
      icon: 'Palette',
      image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=300&fit=crop',
    },
    subcategory: 'Photography',
    host: { first_name: 'Nina', avatar_url: null },
    venue_name: 'South Bank',
    venue_short: 'Southwark',
    venue_lat: 51.5055,
    venue_lng: -0.1142,
    start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    capacity: 6,
    participant_count: 2,
    audience: 'everyone',
    status: 'active',
  },
  {
    id: '10',
    title: 'Dog Walk in the Park',
    category_value: 'pets',
    category: {
      name: 'Pets',
      icon: 'Dog',
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
    },
    subcategory: 'Dog walk',
    host: { first_name: 'Tom', avatar_url: null },
    venue_name: 'Battersea Park',
    venue_short: 'Battersea',
    venue_lat: 51.4794,
    venue_lng: -0.1564,
    start_time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    capacity: 5,
    participant_count: 3,
    audience: 'everyone',
    status: 'active',
  },
];

// Helper to refresh demo event times (they're relative to now)
export function refreshDemoEventTimes(events: DemoEvent[]): DemoEvent[] {
  return events.map((event, index) => {
    const hoursFromNow = [0.5, 2, 6, 5, 3, 20, 4, 7, 24, 8][index] || 4;
    return {
      ...event,
      start_time: new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString(),
    };
  });
}
