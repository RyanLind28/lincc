import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { Header } from '../components/layout';
import {
  SearchBar,
  EventCardGrid,
  CategoryIcon,
  GradientButton,
} from '../components/ui';
import { useBookmarks } from '../hooks/useBookmarks';
import { CATEGORIES } from '../data/categories';
import { supabase } from '../lib/supabase';
import type { EventWithDetails } from '../types';

interface CategoryWithCount {
  value: string;
  label: string;
  icon: string;
  count: number;
}

export default function ExplorePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category');

  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [categoryEvents, setCategoryEvents] = useState<EventWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { savedIds, toggleSave } = useBookmarks();

  // Load categories with event counts
  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error || !data) return;

      // Get counts for active events per category
      const { data: countData } = await supabase
        .from('events')
        .select('category_id')
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

      const countMap: Record<string, number> = {};
      for (const row of countData || []) {
        countMap[row.category_id] = (countMap[row.category_id] || 0) + 1;
      }

      setCategories(
        data.map((cat) => ({
          value: cat.name.toLowerCase(),
          label: cat.name,
          icon: cat.icon,
          count: countMap[cat.id] || 0,
        }))
      );
    };

    loadCategories();
  }, []);

  // Load events for selected category
  useEffect(() => {
    if (!selectedCategory) {
      setCategoryEvents([]);
      return;
    }

    const loadEvents = async () => {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          host:profiles!host_id(*),
          category:categories!category_id(*),
          participant_count:event_participants(count)
        `)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (!error && data) {
        const filtered = data
          .filter((e) => {
            const catName = (e.category as { name: string })?.name?.toLowerCase();
            return catName === selectedCategory;
          })
          .map((e) => ({
            ...e,
            participant_count: (e.participant_count as { count: number }[])?.[0]?.count || 0,
          })) as EventWithDetails[];

        setCategoryEvents(filtered);
      }

      setIsLoading(false);
    };

    loadEvents();
  }, [selectedCategory]);

  // Filter categories by search
  const filteredCategories = search
    ? categories.filter(
        (c) =>
          c.label.toLowerCase().includes(search.toLowerCase()) ||
          CATEGORIES.find((cat) => cat.value === c.value)
            ?.subcategories?.some((sub) =>
              sub.label.toLowerCase().includes(search.toLowerCase())
            )
      )
    : categories;

  const gridEvents = categoryEvents.map((event) => ({
    id: event.id,
    title: event.title,
    category: {
      name: event.category?.name || 'Event',
      icon: event.category?.icon || 'Calendar',
    },
    host: {
      first_name: event.host?.first_name || 'Host',
      avatar_url: event.host?.avatar_url || null,
    },
    venue_name: event.venue_name,
    venue_short: event.venue_address?.split(',')[0] || event.venue_name,
    start_time: event.start_time,
    capacity: event.capacity,
    participant_count: event.participant_count || 0,
  }));

  // Category detail view
  if (selectedCategory) {
    const cat = categories.find((c) => c.value === selectedCategory);

    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 bg-surface border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setSearchParams({})}
              className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-text" />
            </button>
            <h1 className="text-lg font-semibold text-text">{cat?.label || selectedCategory}</h1>
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-surface rounded-2xl border border-border overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : gridEvents.length > 0 ? (
            <EventCardGrid
              events={gridEvents}
              onToggleSave={toggleSave}
              savedIds={savedIds}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-4">
                <CategoryIcon icon={cat?.icon || 'Calendar'} size="xl" className="text-white" />
              </div>
              <h2 className="text-lg font-semibold text-text mb-2">
                No {cat?.label} events right now
              </h2>
              <p className="text-text-muted text-center text-sm mb-6 max-w-xs">
                Be the first to create one!
              </p>
              <GradientButton onClick={() => navigate('/event/new')}>
                Create Event
              </GradientButton>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Category grid view
  return (
    <div className="min-h-screen bg-background">
      <Header showBack title="Explore" />

      <div className="p-4 space-y-4">
        {/* Search categories */}
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder="Search categories..."
          showSuggestions={false}
          size="sm"
        />

        {/* Categories grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {filteredCategories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSearchParams({ category: category.value })}
              className="flex flex-col items-center gap-2 p-4 bg-surface rounded-2xl border border-border hover:border-coral hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <CategoryIcon icon={category.icon} size="lg" className="text-white" />
              </div>
              <span className="text-sm font-medium text-text text-center">
                {category.label}
              </span>
              {category.count > 0 && (
                <span className="text-xs text-coral font-medium">
                  {category.count} active
                </span>
              )}
            </button>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-8 w-8 text-text-light mx-auto mb-3" />
            <p className="text-text-muted">No categories match "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
