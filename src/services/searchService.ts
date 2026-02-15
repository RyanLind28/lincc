// Search service — full-text search + recent searches

import { supabase } from '../lib/supabase';

const RECENT_SEARCHES_KEY = 'lincc_recent_searches';
const MAX_RECENT_SEARCHES = 8;

// ===========================================
// FULL-TEXT SEARCH
// ===========================================

export interface SearchResult {
  event_id: string;
  rank: number;
  title: string;
  venue_name: string;
  category_name: string;
}

/**
 * Full-text search using Supabase database function
 */
export async function searchEvents(query: string, limit = 20): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const { data, error } = await supabase.rpc('search_events', {
    search_query: query.trim(),
    max_results: limit,
  });

  if (error) {
    console.error('Search error:', error);
    // Fallback to ILIKE search if full-text fails
    return fallbackSearch(query, limit);
  }

  return data || [];
}

/**
 * Fallback substring search when full-text isn't available
 */
async function fallbackSearch(query: string, limit: number): Promise<SearchResult[]> {
  const searchTerm = `%${query.trim()}%`;

  const { data, error } = await supabase
    .from('events')
    .select('id, title, venue_name, category:categories!category_id(name)')
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .or(`title.ilike.${searchTerm},venue_name.ilike.${searchTerm},description.ilike.${searchTerm}`)
    .limit(limit);

  if (error) {
    console.error('Fallback search error:', error);
    return [];
  }

  return (data || []).map((e) => ({
    event_id: e.id,
    rank: 1,
    title: e.title,
    venue_name: e.venue_name,
    category_name: (e.category as unknown as { name: string })?.name || '',
  }));
}

/**
 * Get search suggestions (lightweight — just titles/venues matching prefix)
 */
export async function getSearchSuggestions(query: string): Promise<string[]> {
  if (!query.trim() || query.length < 2) return [];

  const searchTerm = `%${query.trim()}%`;

  const { data, error } = await supabase
    .from('events')
    .select('title, venue_name')
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .or(`title.ilike.${searchTerm},venue_name.ilike.${searchTerm}`)
    .limit(6);

  if (error) return [];

  const suggestions = new Set<string>();
  for (const event of data || []) {
    if (event.title.toLowerCase().includes(query.toLowerCase())) {
      suggestions.add(event.title);
    }
    if (event.venue_name.toLowerCase().includes(query.toLowerCase())) {
      suggestions.add(event.venue_name);
    }
  }

  return [...suggestions].slice(0, 5);
}

// ===========================================
// RECENT SEARCHES
// ===========================================

/**
 * Get recent searches from localStorage
 */
export function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save a search term to recent searches
 */
export function saveRecentSearch(term: string): void {
  if (!term.trim()) return;

  try {
    const recent = getRecentSearches();
    // Remove duplicate if exists, add to front
    const updated = [term.trim(), ...recent.filter((s) => s !== term.trim())].slice(
      0,
      MAX_RECENT_SEARCHES
    );
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Remove a specific recent search
 */
export function removeRecentSearch(term: string): void {
  try {
    const recent = getRecentSearches();
    const updated = recent.filter((s) => s !== term);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}

/**
 * Clear all recent searches
 */
export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore
  }
}
