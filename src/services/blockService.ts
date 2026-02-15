import { supabase } from '../lib/supabase';

export async function blockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase
    .from('blocks')
    .insert({ blocker_id: blockerId, blocked_id: blockedId });

  if (error) {
    if (error.code === '23505') return { success: true }; // Already blocked
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function unblockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const { data } = await supabase
    .from('blocks')
    .select('id')
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
    .maybeSingle();

  return !!data;
}

export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', userId);

  return (data || []).map((b) => b.blocked_id);
}
