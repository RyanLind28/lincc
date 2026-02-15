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
  baking: ['food'],
  brunch: ['food'],
  drinks: ['food'],
  wine: ['food'],
  beer: ['food'],
  vegan: ['food'],
  vegetarian: ['food'],
  cocktails: ['food', 'social'],

  // Fitness
  fitness: ['fitness'],
  gym: ['fitness'],
  running: ['fitness', 'outdoors'],
  cycling: ['fitness', 'outdoors'],
  swimming: ['fitness'],
  crossfit: ['fitness'],
  climbing: ['fitness', 'outdoors'],
  hiit: ['fitness'],
  dance: ['fitness', 'entertainment'],
  dancing: ['fitness', 'entertainment'],
  martialarts: ['fitness', 'sports'],
  boxing: ['fitness', 'sports'],

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
  cricket: ['sports'],
  squash: ['sports'],
  rugby: ['sports'],
  tabletennis: ['sports'],
  skateboarding: ['sports', 'outdoors'],
  skating: ['sports', 'outdoors'],
  sailing: ['sports', 'outdoors'],
  surfing: ['sports', 'outdoors'],
  kayaking: ['sports', 'outdoors'],

  // Outdoors
  outdoors: ['outdoors'],
  hiking: ['outdoors', 'fitness'],
  walking: ['outdoors'],
  nature: ['outdoors'],
  camping: ['outdoors'],
  beach: ['outdoors'],
  picnic: ['outdoors', 'social'],
  gardening: ['outdoors'],
  fishing: ['outdoors'],

  // Wellness
  wellness: ['wellness'],
  yoga: ['wellness', 'fitness'],
  meditation: ['wellness'],
  pilates: ['wellness', 'fitness'],
  spa: ['wellness'],
  mindfulness: ['wellness'],
  breathwork: ['wellness'],
  selfcare: ['wellness'],
  skincare: ['wellness'],
  beauty: ['wellness'],

  // Entertainment
  entertainment: ['entertainment'],
  movies: ['entertainment'],
  film: ['entertainment'],
  music: ['entertainment', 'creative'],
  concerts: ['entertainment'],
  comedy: ['entertainment'],
  theatre: ['entertainment'],
  karaoke: ['entertainment', 'social'],
  standup: ['entertainment'],
  improv: ['entertainment'],
  podcast: ['entertainment'],
  listening: ['entertainment'],

  // Gaming
  gaming: ['gaming'],
  videogames: ['gaming'],
  boardgames: ['gaming', 'social'],
  cardgames: ['gaming', 'social'],
  esports: ['gaming'],
  arcade: ['gaming', 'entertainment'],
  chess: ['gaming'],
  trivia: ['gaming', 'social'],
  quiz: ['gaming', 'social'],

  // Creative
  creative: ['creative'],
  art: ['creative'],
  photography: ['creative'],
  pottery: ['creative'],
  crafts: ['creative'],
  diy: ['creative'],
  writing: ['creative', 'learning'],
  musicmaking: ['creative', 'entertainment'],
  drawing: ['creative'],
  painting: ['creative'],

  // Learning
  learning: ['learning'],
  languages: ['learning'],
  language: ['learning'],
  reading: ['learning'],
  bookclub: ['learning', 'social'],
  study: ['learning'],
  workshop: ['learning'],
  coworking: ['learning'],
  tech: ['learning'],
  coding: ['learning'],
  hackathon: ['learning', 'social'],

  // Social
  social: ['social'],
  networking: ['social'],
  party: ['social', 'entertainment'],
  meetup: ['social'],
  travel: ['social', 'outdoors'],
  sightseeing: ['social', 'outdoors'],
  volunteering: ['social'],
  charity: ['social'],
  market: ['social'],
  shopping: ['social'],

  // Pets
  pets: ['pets'],
  dogs: ['pets'],
  cats: ['pets'],
  animals: ['pets'],
};

// Category relationships for "related" scoring
// If a user's tag doesn't directly match, check if the event category is related
// Kept symmetric: if A relates to B, B relates to A
export const RELATED_CATEGORIES: Record<string, string[]> = {
  coffee: ['food', 'social'],
  food: ['coffee', 'social'],
  fitness: ['sports', 'wellness', 'outdoors'],
  sports: ['fitness', 'outdoors', 'social'],
  outdoors: ['fitness', 'sports', 'wellness', 'pets'],
  wellness: ['fitness', 'outdoors', 'social'],
  entertainment: ['social', 'gaming', 'creative'],
  gaming: ['social', 'entertainment'],
  creative: ['learning', 'social', 'entertainment'],
  learning: ['creative', 'social'],
  social: ['food', 'coffee', 'entertainment', 'gaming', 'sports', 'wellness', 'learning'],
  pets: ['outdoors', 'social', 'wellness'],
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
