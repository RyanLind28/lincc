// Maps user interest tags to event categories
// Used by the recommendation algorithm to match user interests with events

// User tags -> array of related category values
export const TAG_TO_CATEGORY_MAP: Record<string, string[]> = {
  // Coffee & Food
  coffee: ['coffee'],
  tea: ['coffee'],
  food: ['food'],
  foodie: ['food'],
  cooking: ['food'],
  brunch: ['food'],
  drinks: ['food'],
  wine: ['food'],
  beer: ['food'],
  vegan: ['food'],
  vegetarian: ['food'],

  // Fitness
  fitness: ['fitness'],
  gym: ['fitness'],
  running: ['fitness', 'outdoors'],
  cycling: ['fitness', 'outdoors'],
  swimming: ['fitness'],
  crossfit: ['fitness'],
  climbing: ['fitness', 'outdoors'],
  hiit: ['fitness'],

  // Sports
  sports: ['sports'],
  tennis: ['sports'],
  padel: ['sports'],
  badminton: ['sports'],
  basketball: ['sports'],
  football: ['sports'],
  volleyball: ['sports'],
  golf: ['sports'],
  bowling: ['sports', 'social'],

  // Outdoors
  outdoors: ['outdoors'],
  hiking: ['outdoors', 'fitness'],
  walking: ['outdoors'],
  nature: ['outdoors'],
  camping: ['outdoors'],
  beach: ['outdoors'],
  picnic: ['outdoors', 'social'],

  // Wellness
  wellness: ['wellness'],
  yoga: ['wellness', 'fitness'],
  meditation: ['wellness'],
  pilates: ['wellness', 'fitness'],
  spa: ['wellness'],
  mindfulness: ['wellness'],
  breathwork: ['wellness'],
  selfcare: ['wellness'],

  // Entertainment
  entertainment: ['entertainment'],
  movies: ['entertainment'],
  film: ['entertainment'],
  music: ['entertainment', 'creative'],
  concerts: ['entertainment'],
  comedy: ['entertainment'],
  theatre: ['entertainment'],
  karaoke: ['entertainment', 'social'],

  // Gaming
  gaming: ['gaming'],
  videogames: ['gaming'],
  boardgames: ['gaming', 'social'],
  cardgames: ['gaming', 'social'],
  esports: ['gaming'],
  arcade: ['gaming', 'entertainment'],

  // Creative
  creative: ['creative'],
  art: ['creative'],
  photography: ['creative'],
  pottery: ['creative'],
  crafts: ['creative'],
  diy: ['creative'],
  writing: ['creative', 'learning'],
  musicmaking: ['creative', 'entertainment'],

  // Learning
  learning: ['learning'],
  languages: ['learning'],
  reading: ['learning'],
  bookclub: ['learning', 'social'],
  study: ['learning'],
  workshop: ['learning'],
  coworking: ['learning'],

  // Social
  social: ['social'],
  networking: ['social'],
  party: ['social', 'entertainment'],
  meetup: ['social'],
  travel: ['social', 'outdoors'],
  sightseeing: ['social', 'outdoors'],

  // Pets
  pets: ['pets'],
  dogs: ['pets'],
  cats: ['pets'],
  animals: ['pets'],
};

// Category relationships for "related" scoring
// If a user's tag doesn't directly match, check if the event category is related
export const RELATED_CATEGORIES: Record<string, string[]> = {
  coffee: ['food', 'social'],
  food: ['coffee', 'social'],
  fitness: ['sports', 'wellness', 'outdoors'],
  sports: ['fitness', 'outdoors'],
  outdoors: ['fitness', 'sports', 'wellness', 'pets'],
  wellness: ['fitness', 'outdoors'],
  entertainment: ['social', 'gaming'],
  gaming: ['social', 'entertainment'],
  creative: ['learning', 'social'],
  learning: ['creative', 'social'],
  social: ['food', 'coffee', 'entertainment', 'gaming'],
  pets: ['outdoors', 'social'],
};

// Get categories that match a user tag
export function getCategoriesForTag(tag: string): string[] {
  const normalizedTag = tag.toLowerCase().trim();
  return TAG_TO_CATEGORY_MAP[normalizedTag] || [];
}

// Check if a category is related to another
export function isRelatedCategory(category: string, relatedTo: string): boolean {
  const related = RELATED_CATEGORIES[category] || [];
  return related.includes(relatedTo);
}

// Get all categories that match any of the user's tags
export function getAllMatchingCategories(tags: string[]): Set<string> {
  const categories = new Set<string>();
  for (const tag of tags) {
    const matched = getCategoriesForTag(tag);
    matched.forEach((cat) => categories.add(cat));
  }
  return categories;
}
