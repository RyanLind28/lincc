import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { Avatar, Spinner } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { getFollowers, getFollowing, type FollowProfile } from '../services/followService';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

type Tab = 'followers' | 'following';

export default function FollowListPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const initialTab = (searchParams.get('tab') as Tab) || 'followers';

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [followers, setFollowers] = useState<FollowProfile[]>([]);
  const [following, setFollowing] = useState<FollowProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');

  const userId = id || user?.id;

  useEffect(() => {
    if (!userId) return;

    async function fetchData() {
      setIsLoading(true);

      // Fetch user name for header
      if (id && id !== user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', id)
          .single();
        setUserName(data?.first_name || '');
      }

      const [followerList, followingList] = await Promise.all([
        getFollowers(userId!),
        getFollowing(userId!),
      ]);

      setFollowers(followerList);
      setFollowing(followingList);
      setIsLoading(false);
    }

    fetchData();
  }, [userId, id, user?.id]);

  const isOwnProfile = !id || id === user?.id;
  const headerTitle = isOwnProfile ? '' : userName;
  const activeList = activeTab === 'followers' ? followers : following;

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header showBack title={headerTitle} />

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('followers')}
          className={cn(
            'flex-1 py-3 text-sm font-medium text-center transition-colors relative',
            activeTab === 'followers'
              ? 'text-coral'
              : 'text-text-muted hover:text-text'
          )}
        >
          Followers{followers.length > 0 ? ` (${followers.length})` : ''}
          {activeTab === 'followers' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-coral" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className={cn(
            'flex-1 py-3 text-sm font-medium text-center transition-colors relative',
            activeTab === 'following'
              ? 'text-coral'
              : 'text-text-muted hover:text-text'
          )}
        >
          Following{following.length > 0 ? ` (${following.length})` : ''}
          {activeTab === 'following' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-coral" />
          )}
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Spinner size="lg" />
        </div>
      ) : activeList.length === 0 ? (
        <div className="text-center p-8 mt-8">
          <p className="text-text-muted">
            {activeTab === 'followers'
              ? 'No followers yet'
              : 'Not following anyone yet'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {activeList.map((person) => (
            <Link
              key={person.id}
              to={`/user/${person.id}`}
              className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
            >
              <Avatar src={person.avatar_url} name={person.first_name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text truncate">{person.first_name}</p>
                {person.bio && (
                  <p className="text-sm text-text-muted truncate">{person.bio}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
