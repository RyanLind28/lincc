import { supabase } from '../lib/supabase';

export async function followUser(followerId: string, followedId: string) {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, followed_id: followedId });

  if (error) {
    if (error.code === '23505') return { success: true }; // Already following
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function unfollowUser(followerId: string, followedId: string) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('followed_id', followedId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function isFollowing(followerId: string, followedId: string): Promise<boolean> {
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('followed_id', followedId)
    .maybeSingle();

  return !!data;
}

export async function getFollowerCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('followed_id', userId);

  return count || 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  return count || 0;
}
