import { supabase } from '../lib/supabase';
import { logAdminAction } from './adminService';

interface Result { success: boolean; error?: string }

async function notifyUser(
  userId: string,
  type: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
) {
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    data,
    is_read: false,
  });
}

// ---- User-level actions ----

export async function warnUser(userId: string, adminId: string, message: string): Promise<Result> {
  const trimmed = message.trim();
  if (!trimmed) return { success: false, error: 'Warning message required' };
  await notifyUser(userId, 'moderation_warning', 'Warning from Lincc moderation', trimmed, { kind: 'warning' });
  await logAdminAction(adminId, 'user.warn', 'user', userId, { message: trimmed });
  return { success: true };
}

export async function suspendUser(
  userId: string,
  adminId: string,
  reason: string,
  durationDays = 7,
): Promise<Result> {
  const trimmed = reason.trim();
  if (!trimmed) return { success: false, error: 'Reason required' };
  const until = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'suspended', suspended_until: until, suspension_reason: trimmed })
    .eq('id', userId);
  if (error) return { success: false, error: error.message };
  await notifyUser(userId, 'moderation_suspension', 'Account suspended', `Your account has been suspended until ${new Date(until).toLocaleDateString()}. Reason: ${trimmed}`);
  await logAdminAction(adminId, 'user.suspend', 'user', userId, { reason: trimmed, until, durationDays });
  return { success: true };
}

export async function banUser(userId: string, adminId: string, reason: string): Promise<Result> {
  const trimmed = reason.trim();
  if (!trimmed) return { success: false, error: 'Reason required' };
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'banned', suspended_until: null, suspension_reason: trimmed })
    .eq('id', userId);
  if (error) return { success: false, error: error.message };
  await notifyUser(userId, 'moderation_ban', 'Account banned', `Your account has been permanently banned. Reason: ${trimmed}`);
  await logAdminAction(adminId, 'user.ban', 'user', userId, { reason: trimmed });
  return { success: true };
}

export async function restoreUser(userId: string, adminId: string): Promise<Result> {
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'active', suspended_until: null, suspension_reason: null })
    .eq('id', userId);
  if (error) return { success: false, error: error.message };
  await notifyUser(userId, 'moderation_restored', 'Account restored', 'Your account has been reinstated.');
  await logAdminAction(adminId, 'user.restore', 'user', userId);
  return { success: true };
}

// ---- Message-level actions ----

export async function deleteEventMessage(messageId: string, adminId: string): Promise<Result> {
  const { error } = await supabase.from('messages').delete().eq('id', messageId);
  if (error) return { success: false, error: error.message };
  await logAdminAction(adminId, 'message.delete', 'event', messageId);
  return { success: true };
}

export async function deleteDirectMessage(dmId: string, adminId: string): Promise<Result> {
  const { error } = await supabase.from('direct_messages').delete().eq('id', dmId);
  if (error) return { success: false, error: error.message };
  await logAdminAction(adminId, 'dm.delete', 'event', dmId);
  return { success: true };
}

// ---- Review-level actions ----
// Admin policies on host_reviews / guest_reviews permit DELETE without
// extra RPC. We also notify the review author so they know it was removed.

export async function deleteHostReview(reviewId: string, adminId: string, reason: string): Promise<Result> {
  const { data: review } = await supabase
    .from('host_reviews')
    .select('guest_id')
    .eq('id', reviewId)
    .maybeSingle();
  const { error } = await supabase.from('host_reviews').delete().eq('id', reviewId);
  if (error) return { success: false, error: error.message };
  if (review?.guest_id) {
    await notifyUser(review.guest_id, 'review_removed', 'Your review was removed', `A moderator removed your review. ${reason.trim() ? `Reason: ${reason.trim()}` : ''}`.trim());
  }
  await logAdminAction(adminId, 'review.delete', 'user', reviewId, { kind: 'host_review', reason });
  return { success: true };
}

export async function deleteGuestReview(reviewId: string, adminId: string, reason: string): Promise<Result> {
  const { data: review } = await supabase
    .from('guest_reviews')
    .select('host_id')
    .eq('id', reviewId)
    .maybeSingle();
  const { error } = await supabase.from('guest_reviews').delete().eq('id', reviewId);
  if (error) return { success: false, error: error.message };
  if (review?.host_id) {
    await notifyUser(review.host_id, 'review_removed', 'Your review was removed', `A moderator removed your review. ${reason.trim() ? `Reason: ${reason.trim()}` : ''}`.trim());
  }
  await logAdminAction(adminId, 'review.delete', 'user', reviewId, { kind: 'guest_review', reason });
  return { success: true };
}

// ---- Event-level actions ----

export async function removeParticipant(eventId: string, userId: string, adminId: string): Promise<Result> {
  const { error } = await supabase
    .from('event_participants')
    .update({ status: 'rejected' })
    .eq('event_id', eventId)
    .eq('user_id', userId);
  if (error) return { success: false, error: error.message };
  await notifyUser(userId, 'participant_removed', 'Removed from event', 'A moderator removed you from an event after a community report.', { event_id: eventId });
  await logAdminAction(adminId, 'event.remove_participant', 'event', eventId, { user_id: userId });
  return { success: true };
}

export async function cancelEvent(eventId: string, adminId: string, reason: string): Promise<Result> {
  const trimmed = reason.trim();
  if (!trimmed) return { success: false, error: 'Reason required' };
  const { data: ev } = await supabase.from('events').select('host_id, title').eq('id', eventId).single();
  const { error } = await supabase
    .from('events')
    .update({ status: 'cancelled', is_flagged: true, flag_reason: trimmed })
    .eq('id', eventId);
  if (error) return { success: false, error: error.message };
  if (ev?.host_id) {
    await notifyUser(ev.host_id, 'event_cancelled', 'Event cancelled by moderation', `Your event ${ev.title ?? ''} was cancelled. Reason: ${trimmed}`, { event_id: eventId });
  }
  await logAdminAction(adminId, 'event.cancel', 'event', eventId, { reason: trimmed });
  return { success: true };
}

// ---- Business-level actions ----

export async function suspendBusiness(businessId: string, adminId: string, reason: string): Promise<Result> {
  const trimmed = reason.trim();
  if (!trimmed) return { success: false, error: 'Reason required' };
  const { error } = await supabase.from('businesses').update({ status: 'suspended' }).eq('id', businessId);
  if (error) return { success: false, error: error.message };
  await logAdminAction(adminId, 'business.suspend', 'business', businessId, { reason: trimmed });
  return { success: true };
}

export async function restoreBusiness(businessId: string, adminId: string): Promise<Result> {
  const { error } = await supabase.from('businesses').update({ status: 'approved' }).eq('id', businessId);
  if (error) return { success: false, error: error.message };
  await logAdminAction(adminId, 'business.restore', 'business', businessId);
  return { success: true };
}
