import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { Input, Avatar, ChatListSkeleton } from '../components/ui';
import { Search, Users, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  getSuggestedUsers,
  getFollowingIds,
  type SuggestedUser,
} from '../services/followService';
import { FollowButton } from '../components/social/FollowButton';

interface UserResult {
  id: string;
  first_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  tags: string[] | null;
  /** When present, this is a friends-of-friends suggestion */
  mutual_count?: number;
}

export default function SearchPeoplePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(true);
  const { user } = useAuth();

  // Initial load: fetch suggestions + current following set (for accurate follow-button state)
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setIsSuggestionsLoading(true);
    Promise.all([getSuggestedUsers(user.id, 12), getFollowingIds(user.id)]).then(
      ([sug, ids]) => {
        if (cancelled) return;
        setSuggestions(sug);
        setFollowingIds(ids);
        setIsSuggestionsLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      const sanitized = query.trim().replace(/[,.()\[\]]/g, '');
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, avatar_url, bio, tags')
        .ilike('first_name', `%${sanitized}%`)
        .neq('id', user?.id || '')
        .eq('status', 'active')
        .limit(20);
      setResults((data ?? []) as UserResult[]);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, user?.id]);

  const handleFollowChange = (targetId: string, now: boolean) => {
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (now) next.add(targetId);
      else next.delete(targetId);
      return next;
    });
  };

  const renderRow = (person: UserResult) => (
    <div
      key={person.id}
      className="flex items-center gap-3 p-4 hover:bg-background transition-colors"
    >
      <Link to={`/user/${person.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar src={person.avatar_url} name={person.first_name ?? 'User'} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-text truncate">{person.first_name || 'User'}</p>
            {person.mutual_count !== undefined && person.mutual_count > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-purple flex-shrink-0">
                <Users className="h-2.5 w-2.5" />
                {person.mutual_count} mutual
              </span>
            )}
          </div>
          {person.bio && (
            <p className="text-sm text-text-muted truncate">{person.bio}</p>
          )}
          {person.tags && person.tags.length > 0 && (
            <div className="flex gap-1 mt-1 overflow-hidden">
              {person.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 bg-background rounded-full text-text-light whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
              {person.tags.length > 3 && (
                <span className="text-[10px] text-text-light">+{person.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </Link>
      {user?.id && (
        <FollowButton
          currentUserId={user.id}
          targetUserId={person.id}
          initiallyFollowing={followingIds.has(person.id)}
          onChange={(now) => handleFollowChange(person.id, now)}
        />
      )}
    </div>
  );

  const showSearch = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-background pb-20 max-w-5xl mx-auto">
      <Header showBack />

      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold text-text">Find People</h1>

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name..."
          leftIcon={<Search className="h-4 w-4" />}
          autoFocus
        />

        {showSearch ? (
          /* Search results */
          isSearching ? (
            <ChatListSkeleton count={5} />
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-text mb-1">No one found</h2>
              <p className="text-sm text-text-muted text-center">Try a different name.</p>
            </div>
          ) : (
            <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
              {results.map(renderRow)}
            </div>
          )
        ) : (
          /* Suggestions (default view) */
          <>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-text-muted uppercase tracking-wide">
                <Sparkles className="h-4 w-4 text-coral" />
                Suggested for you
              </div>
              {!isSuggestionsLoading && suggestions.length > 0 && suggestions.every((s) => s.mutual_count === 0) && (
                <p className="text-xs text-text-light mt-1">Popular on Lincc. Follow a few to unlock friend-based suggestions.</p>
              )}
            </div>
            {isSuggestionsLoading ? (
              <ChatListSkeleton count={5} />
            ) : suggestions.length > 0 ? (
              <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
                {suggestions.map((s) =>
                  renderRow({
                    id: s.id,
                    first_name: s.first_name,
                    avatar_url: s.avatar_url,
                    bio: s.bio,
                    tags: s.tags,
                    mutual_count: s.mutual_count,
                  })
                )}
              </div>
            ) : (
              <div className="text-center py-10 px-4">
                <div className="w-14 h-14 rounded-full bg-coral/10 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-7 w-7 text-coral" />
                </div>
                <p className="text-sm font-semibold text-text mb-1">No one to suggest yet</p>
                <p className="text-xs text-text-muted max-w-xs mx-auto">
                  Lincc is still getting started. Check back as more people join.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
