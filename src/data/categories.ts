// Category system with subcategories
// Icons use Lucide icon names

export interface SubCategory {
  value: string;
  label: string;
  image?: string;
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
      { value: 'coffee-casual', label: 'Casual chat', image: 'https://images.unsplash.com/photo-1521495084171-3ad639e3d525?w=400&h=300&fit=crop' },
      { value: 'coffee-work', label: 'Work from cafe', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop' },
      { value: 'coffee-specialty', label: 'Specialty coffee', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop' },
      { value: 'coffee-tea', label: 'Tea time', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop' },
    ],
  },
  {
    value: 'food',
    label: 'Food & Drinks',
    icon: 'Utensils',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'food-quickbite', label: 'Quick bite', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop' },
      { value: 'food-brunch', label: 'Brunch', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop' },
      { value: 'food-dinner', label: 'Nice dinner', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop' },
      { value: 'food-drinks', label: 'Drinks & bar', image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=300&fit=crop' },
      { value: 'food-cooking', label: 'Cook together', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=300&fit=crop' },
      { value: 'food-foodie', label: 'Foodie adventure', image: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=300&fit=crop' },
    ],
  },
  {
    value: 'fitness',
    label: 'Fitness',
    icon: 'Dumbbell',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'fitness-gym', label: 'Gym session', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop' },
      { value: 'fitness-running', label: 'Running', image: 'https://images.unsplash.com/photo-1461896836934-bd45ba09d833?w=400&h=300&fit=crop' },
      { value: 'fitness-cycling', label: 'Cycling', image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=300&fit=crop' },
      { value: 'fitness-swimming', label: 'Swimming', image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=300&fit=crop' },
      { value: 'fitness-hiit', label: 'HIIT / CrossFit', image: 'https://images.unsplash.com/photo-1520877880798-5ee004e3f11e?w=400&h=300&fit=crop' },
      { value: 'fitness-climbing', label: 'Climbing', image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=400&h=300&fit=crop' },
    ],
  },
  {
    value: 'sports',
    label: 'Sports',
    icon: 'Trophy',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'sports-tennis', label: 'Tennis / Padel', image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=300&fit=crop' },
      { value: 'sports-badminton', label: 'Badminton', image: 'https://images.unsplash.com/photo-1613918431703-aa50889e3be2?w=400&h=300&fit=crop' },
      { value: 'sports-basketball', label: 'Basketball', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop' },
      { value: 'sports-football', label: 'Football', image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=300&fit=crop' },
      { value: 'sports-volleyball', label: 'Volleyball', image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&h=300&fit=crop' },
      { value: 'sports-golf', label: 'Golf', image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop' },
      { value: 'sports-bowling', label: 'Bowling', image: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=400&h=300&fit=crop' },
    ],
  },
  {
    value: 'outdoors',
    label: 'Outdoors',
    icon: 'TreePine',
    image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'outdoors-hiking', label: 'Hiking', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop' },
      { value: 'outdoors-walking', label: 'Walking', image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=300&fit=crop' },
      { value: 'outdoors-picnic', label: 'Picnic', image: 'https://images.unsplash.com/photo-1526662092594-e98c1e356d6a?w=400&h=300&fit=crop' },
      { value: 'outdoors-beach', label: 'Beach day', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop' },
      { value: 'outdoors-park', label: 'Park hangout', image: 'https://images.unsplash.com/photo-1585938389612-a552a28c6914?w=400&h=300&fit=crop' },
      { value: 'outdoors-camping', label: 'Camping', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop' },
    ],
  },
  {
    value: 'wellness',
    label: 'Wellness',
    icon: 'Heart',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'wellness-yoga', label: 'Yoga', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop' },
      { value: 'wellness-meditation', label: 'Meditation', image: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400&h=300&fit=crop' },
      { value: 'wellness-pilates', label: 'Pilates', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop' },
      { value: 'wellness-spa', label: 'Spa day', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6e?w=400&h=300&fit=crop' },
      { value: 'wellness-breathwork', label: 'Breathwork', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop' },
    ],
  },
  {
    value: 'entertainment',
    label: 'Entertainment',
    icon: 'Film',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'entertainment-movies', label: 'Movies', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop' },
      { value: 'entertainment-concert', label: 'Concert / Gig', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop' },
      { value: 'entertainment-comedy', label: 'Comedy show', image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=400&h=300&fit=crop' },
      { value: 'entertainment-theatre', label: 'Theatre', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=300&fit=crop' },
      { value: 'entertainment-karaoke', label: 'Karaoke', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop' },
    ],
  },
  {
    value: 'gaming',
    label: 'Gaming',
    icon: 'Gamepad2',
    image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'gaming-videogames', label: 'Video games', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b28?w=400&h=300&fit=crop' },
      { value: 'gaming-boardgames', label: 'Board games', image: 'https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=400&h=300&fit=crop' },
      { value: 'gaming-cardgames', label: 'Card games', image: 'https://images.unsplash.com/photo-1541278107931-e006523892df?w=400&h=300&fit=crop' },
      { value: 'gaming-arcade', label: 'Arcade', image: 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=400&h=300&fit=crop' },
      { value: 'gaming-esports', label: 'eSports viewing', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop' },
    ],
  },
  {
    value: 'creative',
    label: 'Creative',
    icon: 'Palette',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'creative-art', label: 'Art class', image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop' },
      { value: 'creative-pottery', label: 'Pottery', image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=300&fit=crop' },
      { value: 'creative-photography', label: 'Photography', image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=300&fit=crop' },
      { value: 'creative-music', label: 'Music jam', image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=300&fit=crop' },
      { value: 'creative-crafts', label: 'Crafts / DIY', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop' },
      { value: 'creative-writing', label: 'Writing group', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop' },
    ],
  },
  {
    value: 'learning',
    label: 'Learning',
    icon: 'BookOpen',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'learning-language', label: 'Language exchange', image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&h=300&fit=crop' },
      { value: 'learning-bookclub', label: 'Book club', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop' },
      { value: 'learning-study', label: 'Study session', image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop' },
      { value: 'learning-workshop', label: 'Workshop', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=300&fit=crop' },
      { value: 'learning-cowork', label: 'Co-working', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop' },
    ],
  },
  {
    value: 'social',
    label: 'Social',
    icon: 'PartyPopper',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'social-networking', label: 'Networking', image: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=400&h=300&fit=crop' },
      { value: 'social-party', label: 'Party / Night out', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop' },
      { value: 'social-meetup', label: 'Casual meetup', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop' },
      { value: 'social-sightseeing', label: 'Sightseeing', image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=300&fit=crop' },
      { value: 'social-daytrip', label: 'Day trip', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=300&fit=crop' },
    ],
  },
  {
    value: 'pets',
    label: 'Pets',
    icon: 'Dog',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'pets-dogwalk', label: 'Dog walk', image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop' },
      { value: 'pets-dogpark', label: 'Dog park', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop' },
      { value: 'pets-petcafe', label: 'Pet cafe', image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop' },
    ],
  },
  {
    value: 'kids-family',
    label: 'Kids & Family',
    icon: 'Baby',
    image: 'https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=400&h=300&fit=crop',
    subcategories: [
      { value: 'kids-family-playground', label: 'Playground trip', image: 'https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=400&h=300&fit=crop' },
      { value: 'kids-family-playdate', label: 'Playdate', image: 'https://images.unsplash.com/photo-1484820540004-14229fe36ca4?w=400&h=300&fit=crop' },
      { value: 'kids-family-crafts', label: 'Kids crafts', image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop' },
      { value: 'kids-family-museum', label: 'Museum / Exhibition', image: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400&h=300&fit=crop' },
      { value: 'kids-family-party', label: 'Kids party', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop' },
      { value: 'kids-family-outdoors', label: 'Family outdoors', image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=300&fit=crop' },
    ],
  },
  {
    value: 'other',
    label: 'Other',
    icon: 'Ellipsis',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop',
    subcategories: [],
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
