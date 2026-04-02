import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { Input, Avatar, ChatListSkeleton } from '../components/ui';
import { Search, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UserResult {
  id: string;
  first_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  tags: string[] | null;
}

export default function SearchPeoplePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      const sanitized = query.trim().replace(/[,.()\[\]]/g, '');
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, avatar_url, bio, tags')
        .ilike('first_name', `%${sanitized}%`)
        .neq('id', user?.id || '')
        .eq('status', 'active')
        .limit(20);
      setResults((data ?? []) as UserResult[]);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, user?.id]);

  return (
    <div className="min-h-screen bg-background pb-20 max-w-2xl mx-auto">
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

        {isLoading ? (
          <ChatListSkeleton count={5} />
        ) : query.trim() && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-1">No one found</h2>
            <p className="text-sm text-text-muted text-center">Try a different name.</p>
          </div>
        ) : results.length > 0 ? (
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            {results.map((person) => (
              <Link
                key={person.id}
                to={`/user/${person.id}`}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
              >
                <Avatar src={person.avatar_url} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text truncate">
                      {person.first_name || 'User'}
                    </p>
                  </div>
                  {person.bio && (
                    <p className="text-sm text-text-muted truncate">{person.bio}</p>
                  )}
                  {person.tags && person.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 overflow-hidden">
                      {person.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded-full text-text-light whitespace-nowrap">{tag}</span>
                      ))}
                      {person.tags.length > 3 && (
                        <span className="text-[10px] text-text-light">+{person.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : !query.trim() ? (
          <div className="text-center py-8">
            <p className="text-sm text-text-muted">Search for people by name to follow and connect.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
