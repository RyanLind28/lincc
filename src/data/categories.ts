// Category system with subcategories
// Icons use Lucide icon names

export interface SubCategory {
  value: string;
  label: string;
}

export interface Category {
  value: string;
  label: string;
  icon: string; // Lucide icon name
  image: string;
  subcategories: SubCategory[];
}

export const CATEGORIES: Category[] = [
  {
    value: 'coffee',
    label: 'Coffee',
    icon: 'Coffee',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'coffee-casual', label: 'Casual chat' },
      { value: 'coffee-work', label: 'Work from cafe' },
      { value: 'coffee-specialty', label: 'Specialty coffee' },
      { value: 'coffee-tea', label: 'Tea time' },
    ],
  },
  {
    value: 'food',
    label: 'Food & Drinks',
    icon: 'Utensils',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'food-quickbite', label: 'Quick bite' },
      { value: 'food-brunch', label: 'Brunch' },
      { value: 'food-dinner', label: 'Nice dinner' },
      { value: 'food-drinks', label: 'Drinks & bar' },
      { value: 'food-cooking', label: 'Cook together' },
      { value: 'food-foodie', label: 'Foodie adventure' },
    ],
  },
  {
    value: 'fitness',
    label: 'Fitness',
    icon: 'Dumbbell',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'fitness-gym', label: 'Gym session' },
      { value: 'fitness-running', label: 'Running' },
      { value: 'fitness-cycling', label: 'Cycling' },
      { value: 'fitness-swimming', label: 'Swimming' },
      { value: 'fitness-hiit', label: 'HIIT / CrossFit' },
      { value: 'fitness-climbing', label: 'Climbing' },
    ],
  },
  {
    value: 'sports',
    label: 'Sports',
    icon: 'Trophy',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'sports-tennis', label: 'Tennis / Padel' },
      { value: 'sports-badminton', label: 'Badminton' },
      { value: 'sports-basketball', label: 'Basketball' },
      { value: 'sports-football', label: 'Football' },
      { value: 'sports-volleyball', label: 'Volleyball' },
      { value: 'sports-golf', label: 'Golf' },
      { value: 'sports-bowling', label: 'Bowling' },
    ],
  },
  {
    value: 'outdoors',
    label: 'Outdoors',
    icon: 'TreePine',
    image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'outdoors-hiking', label: 'Hiking' },
      { value: 'outdoors-walking', label: 'Walking' },
      { value: 'outdoors-picnic', label: 'Picnic' },
      { value: 'outdoors-beach', label: 'Beach day' },
      { value: 'outdoors-park', label: 'Park hangout' },
      { value: 'outdoors-camping', label: 'Camping' },
    ],
  },
  {
    value: 'wellness',
    label: 'Wellness',
    icon: 'Heart',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'wellness-yoga', label: 'Yoga' },
      { value: 'wellness-meditation', label: 'Meditation' },
      { value: 'wellness-pilates', label: 'Pilates' },
      { value: 'wellness-spa', label: 'Spa day' },
      { value: 'wellness-breathwork', label: 'Breathwork' },
    ],
  },
  {
    value: 'entertainment',
    label: 'Entertainment',
    icon: 'Film',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'entertainment-movies', label: 'Movies' },
      { value: 'entertainment-concert', label: 'Concert / Gig' },
      { value: 'entertainment-comedy', label: 'Comedy show' },
      { value: 'entertainment-theatre', label: 'Theatre' },
      { value: 'entertainment-karaoke', label: 'Karaoke' },
    ],
  },
  {
    value: 'gaming',
    label: 'Gaming',
    icon: 'Gamepad2',
    image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'gaming-videogames', label: 'Video games' },
      { value: 'gaming-boardgames', label: 'Board games' },
      { value: 'gaming-cardgames', label: 'Card games' },
      { value: 'gaming-arcade', label: 'Arcade' },
      { value: 'gaming-esports', label: 'eSports viewing' },
    ],
  },
  {
    value: 'creative',
    label: 'Creative',
    icon: 'Palette',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'creative-art', label: 'Art class' },
      { value: 'creative-pottery', label: 'Pottery' },
      { value: 'creative-photography', label: 'Photography' },
      { value: 'creative-music', label: 'Music jam' },
      { value: 'creative-crafts', label: 'Crafts / DIY' },
      { value: 'creative-writing', label: 'Writing group' },
    ],
  },
  {
    value: 'learning',
    label: 'Learning',
    icon: 'BookOpen',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'learning-language', label: 'Language exchange' },
      { value: 'learning-bookclub', label: 'Book club' },
      { value: 'learning-study', label: 'Study session' },
      { value: 'learning-workshop', label: 'Workshop' },
      { value: 'learning-cowork', label: 'Co-working' },
    ],
  },
  {
    value: 'social',
    label: 'Social',
    icon: 'PartyPopper',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'social-networking', label: 'Networking' },
      { value: 'social-party', label: 'Party / Night out' },
      { value: 'social-meetup', label: 'Casual meetup' },
      { value: 'social-sightseeing', label: 'Sightseeing' },
      { value: 'social-daytrip', label: 'Day trip' },
    ],
  },
  {
    value: 'pets',
    label: 'Pets',
    icon: 'Dog',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'pets-dogwalk', label: 'Dog walk' },
      { value: 'pets-dogpark', label: 'Dog park' },
      { value: 'pets-petcafe', label: 'Pet cafe' },
    ],
  },
];

// Helper to get category by value
export function getCategoryByValue(value: string): Category | undefined {
  return CATEGORIES.find((cat) => cat.value === value);
}

// Helper to get subcategory label
export function getSubcategoryLabel(categoryValue: string, subValue: string): string {
  const category = getCategoryByValue(categoryValue);
  const sub = category?.subcategories.find((s) => s.value === subValue);
  return sub?.label || subValue;
}

// Helper to flatten all categories and subcategories for search
export function getAllCategoriesFlat() {
  return CATEGORIES.flatMap((cat) => [
    { value: cat.value, label: cat.label, icon: cat.icon, isMain: true },
    ...cat.subcategories.map((sub) => ({
      value: sub.value,
      label: sub.label,
      icon: cat.icon,
      isMain: false,
      parentValue: cat.value,
      parentLabel: cat.label,
    })),
  ]);
}
