import { supabase } from '../lib/supabase';

/**
 * Counts of items needing admin action across the panel — used for badges
 * on the Manage tile grid. Each value defaults to 0 if RLS hides it.
 */
export async function getAdminActionCounts(): Promise<{
  pendingApplications: number;
  pendingVerifications: number;
  pendingReports: number;
  flaggedEvents: number;
  flaggedUsers: number;
}> {
  const [apps, verifs, reports, flaggedEvents, flaggedUsers] = await Promise.all([
    supabase.from('businesses').select('id', { count: 'exact', head: true }).in('status', ['pending_approval', 'rejected']),
    supabase.from('business_verifications').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'in_review']),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('is_flagged', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_flagged', true),
  ]);
  return {
    pendingApplications: apps.count ?? 0,
    pendingVerifications: verifs.count ?? 0,
    pendingReports: reports.count ?? 0,
    flaggedEvents: flaggedEvents.count ?? 0,
    flaggedUsers: flaggedUsers.count ?? 0,
  };
}

// Dashboard stats
export async function getAdminStats() {
  const [users, events, reports, categories] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
  ]);

  return {
    totalUsers: users.count ?? 0,
    activeEvents: events.count ?? 0,
    pendingReports: reports.count ?? 0,
    totalCategories: categories.count ?? 0,
  };
}

// Dashboard metrics — all time-bounded to last `days`
export async function getDashboardMetrics(days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString();

  const [
    newUsers, newEvents, joinRequests, approvedJoins,
    eventMessages, dms, newVouchers, redemptions, newBusinesses, newReports,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', sinceStr),
    supabase.from('events').select('id', { count: 'exact', head: true }).gte('created_at', sinceStr),
    supabase.from('event_participants').select('id', { count: 'exact', head: true }).gte('created_at', sinceStr),
    supabase.from('event_participants').select('id', { count: 'exact', head: true }).eq('status', 'approved').gte('created_at', sinceStr),
    supabase.from('messages').select('id', { count: 'exact', head: true }).gte('created_at', sinceStr),
    supabase.from('direct_messages').select('id', { count: 'exact', head: true }).gte('created_at', sinceStr),
    supabase.from('vouchers').select('id', { count: 'exact', head: true }).gte('created_at', sinceStr),
    supabase.from('voucher_redemptions').select('id', { count: 'exact', head: true }).gte('redeemed_at', sinceStr),
    supabase.from('businesses').select('id', { count: 'exact', head: true }).gte('created_at', sinceStr),
    supabase.from('reports').select('id', { count: 'exact', head: true }).gte('created_at', sinceStr),
  ]);

  return {
    newUsers: newUsers.count ?? 0,
    newEvents: newEvents.count ?? 0,
    joinRequests: joinRequests.count ?? 0,
    approvedJoins: approvedJoins.count ?? 0,
    messages: (eventMessages.count ?? 0) + (dms.count ?? 0),
    newVouchers: newVouchers.count ?? 0,
    redemptions: redemptions.count ?? 0,
    newBusinesses: newBusinesses.count ?? 0,
    newReports: newReports.count ?? 0,
  };
}

// Engagement timeseries — daily join requests + messages over last `days`
export async function getEngagementData(days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString();

  const [joins, msgs] = await Promise.all([
    supabase.from('event_participants').select('created_at').gte('created_at', sinceStr),
    supabase.from('messages').select('created_at').gte('created_at', sinceStr),
  ]);

  const groupByDate = (rows: { created_at: string }[]) => {
    const map: Record<string, number> = {};
    for (const row of rows) {
      const date = row.created_at.slice(0, 10);
      map[date] = (map[date] || 0) + 1;
    }
    return map;
  };

  return {
    joinsByDate: groupByDate((joins.data ?? []) as { created_at: string }[]),
    messagesByDate: groupByDate((msgs.data ?? []) as { created_at: string }[]),
  };
}

// Top hosts — most events created in last `days`
export async function getTopHosts(days: number, limit = 5) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabase
    .from('events')
    .select('host_id, profiles!events_host_id_fkey(first_name, avatar_url)')
    .gte('created_at', since.toISOString());

  type Row = { host_id: string; profiles: { first_name: string | null; avatar_url: string | null } | null };
  const counts = new Map<string, { count: number; name: string; avatar: string | null }>();
  for (const r of (data ?? []) as unknown as Row[]) {
    const existing = counts.get(r.host_id);
    if (existing) existing.count++;
    else counts.set(r.host_id, { count: 1, name: r.profiles?.first_name ?? 'Unknown', avatar: r.profiles?.avatar_url ?? null });
  }
  return Array.from(counts.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Top categories — most approved joins in last `days`
export async function getTopCategories(days: number, limit = 5) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabase
    .from('event_participants')
    .select('event:events!event_id(category:categories!category_id(id, name, icon))')
    .eq('status', 'approved')
    .gte('created_at', since.toISOString());

  type Row = { event: { category: { id: string; name: string; icon: string | null } | null } | null };
  const counts = new Map<string, { count: number; name: string; icon: string | null }>();
  for (const r of (data ?? []) as unknown as Row[]) {
    const cat = r.event?.category;
    if (!cat) continue;
    const existing = counts.get(cat.id);
    if (existing) existing.count++;
    else counts.set(cat.id, { count: 1, name: cat.name, icon: cat.icon });
  }
  return Array.from(counts.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Top businesses — most voucher redemptions in last `days`
export async function getTopBusinesses(days: number, limit = 5) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabase
    .from('voucher_redemptions')
    .select('voucher:vouchers!voucher_id(business:businesses!business_id(id, name, logo_url))')
    .gte('redeemed_at', since.toISOString());

  type Row = { voucher: { business: { id: string; name: string; logo_url: string | null } | null } | null };
  const counts = new Map<string, { count: number; name: string; logo: string | null }>();
  for (const r of (data ?? []) as unknown as Row[]) {
    const biz = r.voucher?.business;
    if (!biz) continue;
    const existing = counts.get(biz.id);
    if (existing) existing.count++;
    else counts.set(biz.id, { count: 1, name: biz.name, logo: biz.logo_url });
  }
  return Array.from(counts.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Analytics — growth data for charts
export async function getGrowthData(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString();

  const [users, events] = await Promise.all([
    supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', sinceStr)
      .order('created_at', { ascending: true }),
    supabase
      .from('events')
      .select('created_at')
      .gte('created_at', sinceStr)
      .order('created_at', { ascending: true }),
  ]);

  // Group by date
  const groupByDate = (rows: { created_at: string }[]) => {
    const map: Record<string, number> = {};
    for (const row of rows) {
      const date = row.created_at.slice(0, 10);
      map[date] = (map[date] || 0) + 1;
    }
    return map;
  };

  return {
    usersByDate: groupByDate((users.data ?? []) as { created_at: string }[]),
    eventsByDate: groupByDate((events.data ?? []) as { created_at: string }[]),
  };
}

// Event analytics
export async function getEventAnalytics() {
  const [total, active, expired, cancelled, participants] = await Promise.all([
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'expired'),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
    supabase.from('event_participants').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
  ]);

  return {
    total: total.count ?? 0,
    active: active.count ?? 0,
    expired: expired.count ?? 0,
    cancelled: cancelled.count ?? 0,
    totalJoins: participants.count ?? 0,
  };
}

// Recent activity feed
export async function getRecentActivity(limit = 20) {
  const [recentUsers, recentEvents, recentReports] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, first_name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('events')
      .select('id, title, status, created_at, profiles!events_host_id_fkey(first_name)')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('reports')
      .select('id, reason, status, created_at, reporter:profiles!reports_reporter_id_fkey(first_name)')
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  type ActivityItem = { type: 'user' | 'event' | 'report'; id: string; text: string; created_at: string; status?: string };
  const items: ActivityItem[] = [];

  for (const u of (recentUsers.data ?? [])) {
    items.push({ type: 'user', id: u.id, text: `${u.first_name || u.email} joined`, created_at: u.created_at });
  }
  for (const e of (recentEvents.data ?? []) as unknown as Array<{ id: string; title: string; status: string; created_at: string; profiles: { first_name: string } | null }>) {
    items.push({ type: 'event', id: e.id, text: `${e.profiles?.first_name || 'Someone'} created "${e.title}"`, created_at: e.created_at, status: e.status });
  }
  for (const r of (recentReports.data ?? []) as unknown as Array<{ id: string; reason: string; status: string; created_at: string; reporter: { first_name: string } | null }>) {
    items.push({ type: 'report', id: r.id, text: `${r.reporter?.first_name || 'Someone'} reported: ${r.reason}`, created_at: r.created_at, status: r.status });
  }

  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return items.slice(0, limit);
}

// CSV export helpers
export async function exportUsersCSV() {
  const { data } = await supabase
    .from('profiles')
    .select('id, email, first_name, gender, role, status, account_type, created_at')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function exportEventsCSV() {
  const { data } = await supabase
    .from('events')
    .select('id, title, venue_name, start_time, status, participant_count, capacity, created_at, profiles!events_host_id_fkey(first_name)')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function exportReportsCSV() {
  const { data } = await supabase
    .from('reports')
    .select('id, reason, details, status, admin_notes, created_at, reviewed_at, reporter:profiles!reports_reporter_id_fkey(first_name), reported:profiles!reports_reported_user_id_fkey(first_name)')
    .order('created_at', { ascending: false });
  return data ?? [];
}

// Bulk user actions
export async function bulkUpdateUserStatus(userIds: string[], status: 'active' | 'suspended' | 'banned') {
  const { error } = await supabase
    .from('profiles')
    .update({ status })
    .in('id', userIds);
  return { success: !error, error: error?.message };
}

// Announcements
export async function fetchAnnouncements(activeOnly = false) {
  let query = supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });
  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function createAnnouncement(title: string, body: string, type: string, expiresAt: string | null, createdBy: string) {
  const { error } = await supabase
    .from('announcements')
    .insert({ title, body, type, expires_at: expiresAt, created_by: createdBy });
  return { success: !error, error: error?.message };
}

export async function toggleAnnouncement(id: string, isActive: boolean) {
  const { error } = await supabase
    .from('announcements')
    .update({ is_active: isActive })
    .eq('id', id);
  return { success: !error, error: error?.message };
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);
  return { success: !error, error: error?.message };
}

// Push notifications

export interface PushStats {
  total_devices: number;
  subscribed_users: number;
  subscribed_personal: number;
  subscribed_business: number;
  total_active_personal: number;
  total_active_business: number;
}

/** Subscription counts for the admin push panel (admin-gated RPC). */
export async function getPushStats(): Promise<{ data: PushStats | null; error?: string }> {
  const { data, error } = await supabase.rpc('get_push_stats');
  // The RPC returns a single-row table.
  const row = Array.isArray(data) ? data[0] : data;
  return { data: (row as PushStats) ?? null, error: error?.message };
}

export type BroadcastAudience = 'users' | 'businesses' | 'all';

/**
 * Send a notification (in-app row + web push) to all active personal users,
 * all businesses, or everyone. Returns the recipient count. `url` is an optional
 * in-app path opened when the notification is tapped.
 */
export async function broadcastPushNotification(
  audience: BroadcastAudience,
  title: string,
  body: string,
  url: string | null,
): Promise<{ success: boolean; recipients: number; error?: string }> {
  const { data, error } = await supabase.rpc('admin_broadcast_notification', {
    p_audience: audience,
    p_title: title,
    p_body: body,
    p_url: url,
  });
  return { success: !error, recipients: (data as number) ?? 0, error: error?.message };
}

// Feature flags
export async function fetchFeatureFlags() {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('key', { ascending: true });
  return { data: data ?? [], error };
}

export async function toggleFeatureFlag(id: string, isEnabled: boolean, updatedBy: string) {
  const { error } = await supabase
    .from('feature_flags')
    .update({ is_enabled: isEnabled, updated_at: new Date().toISOString(), updated_by: updatedBy })
    .eq('id', id);
  return { success: !error, error: error?.message };
}

// Audit log
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: 'user' | 'event' | 'report' | 'category' | 'business' | 'business_verification' | 'image' | 'broadcast',
  targetId?: string,
  details?: Record<string, unknown>
) {
  await supabase
    .from('admin_audit_log')
    .insert({ admin_id: adminId, action, target_type: targetType, target_id: targetId, details: details || {} });
}

export async function fetchAuditLog(offset = 0, limit = 30) {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('id, action, target_type, target_id, details, created_at, admin:profiles!admin_audit_log_admin_id_fkey(first_name)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  return { data: data ?? [], error };
}

// Content moderation — flag/unflag
export async function flagEvent(eventId: string, reason: string) {
  const { error } = await supabase
    .from('events')
    .update({ is_flagged: true, flag_reason: reason })
    .eq('id', eventId);
  return { success: !error, error: error?.message };
}

export async function unflagEvent(eventId: string) {
  const { error } = await supabase
    .from('events')
    .update({ is_flagged: false, flag_reason: null })
    .eq('id', eventId);
  return { success: !error, error: error?.message };
}

export async function flagUser(userId: string, reason: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_flagged: true, flag_reason: reason })
    .eq('id', userId);
  return { success: !error, error: error?.message };
}

export async function unflagUser(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_flagged: false, flag_reason: null })
    .eq('id', userId);
  return { success: !error, error: error?.message };
}

// User detail (admin)
// PostgREST types every embedded join as an array (it doesn't know cardinality).
// For FK relationships that are one-to-one at the source row (host_id, event_id, etc.)
// we cast the embedded resource to a single object so UI code can do ep.event.title.
export interface UserDetailEventHosted {
  id: string;
  title: string;
  status: string;
  start_time: string;
  participant_count: number;
  capacity: number;
  created_at: string;
}
export interface UserDetailParticipation {
  id: string;
  status: string;
  created_at: string;
  event: { id: string; title: string; status: string; start_time: string } | null;
}
export interface UserDetailReportFiled {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  reported: { first_name: string | null } | null;
  event: { title: string } | null;
}
export interface UserDetailReportReceived {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter: { first_name: string | null } | null;
  event: { title: string } | null;
}

export async function getUserDetail(userId: string) {
  const [{ data: profile }, hosted, joined, msgCount, filedReports, receivedReports, followerCount, followingCount] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('events').select('id, title, status, start_time, participant_count, capacity, created_at', { count: 'exact' })
      .eq('host_id', userId).order('created_at', { ascending: false }).limit(10),
    supabase.from('event_participants').select('id, status, created_at, event:events!event_id(id, title, status, start_time)', { count: 'exact' })
      .eq('user_id', userId).neq('status', 'left').order('created_at', { ascending: false }).limit(10),
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('reports').select('id, reason, status, created_at, reported:profiles!reports_reported_user_id_fkey(first_name), event:events!reports_event_id_fkey(title)', { count: 'exact' })
      .eq('reporter_id', userId).order('created_at', { ascending: false }).limit(10),
    supabase.from('reports').select('id, reason, status, created_at, reporter:profiles!reports_reporter_id_fkey(first_name), event:events!reports_event_id_fkey(title)', { count: 'exact' })
      .eq('reported_user_id', userId).order('created_at', { ascending: false }).limit(10),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);

  return {
    profile,
    eventsHosted: {
      items: (hosted.data ?? []) as unknown as UserDetailEventHosted[],
      total: hosted.count ?? 0,
    },
    eventsJoined: {
      items: (joined.data ?? []) as unknown as UserDetailParticipation[],
      total: joined.count ?? 0,
    },
    messagesTotal: msgCount.count ?? 0,
    reportsFiled: {
      items: (filedReports.data ?? []) as unknown as UserDetailReportFiled[],
      total: filedReports.count ?? 0,
    },
    reportsReceived: {
      items: (receivedReports.data ?? []) as unknown as UserDetailReportReceived[],
      total: receivedReports.count ?? 0,
    },
    followerCount: followerCount.count ?? 0,
    followingCount: followingCount.count ?? 0,
  };
}

// Send a password reset email to the user's inbox (on admin's behalf)
export async function sendAdminPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { success: !error, error: error?.message };
}

// Users
export async function fetchAdminUsers(
  search = '',
  filters: { status?: string; role?: string; flagged?: boolean } = {},
  offset = 0,
  limit = 20,
) {
  let query = supabase
    .from('profiles')
    .select('id, email, first_name, avatar_url, gender, role, status, tags, is_flagged, account_type, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.role) query = query.eq('role', filters.role);
  if (filters.flagged) query = query.eq('is_flagged', true);

  if (search) {
    query = query.or(`first_name.ilike.%${search.replace(/[,.()\[\]]/g, '')}%,email.ilike.%${search.replace(/[,.()\[\]]/g, '')}%`);
  }

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned') {
  const { error } = await supabase
    .from('profiles')
    .update({ status })
    .eq('id', userId);
  return { success: !error, error: error?.message };
}

export async function updateUserRole(userId: string, role: 'user' | 'admin') {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);
  return { success: !error, error: error?.message };
}

// Hard-deletes a user account (admin only). Removes auth.users + cascades
// through every per-user table. Server-side function enforces admin role
// and refuses self-deletion or deleting another admin.
export async function adminDeleteUser(userId: string) {
  const { error } = await supabase.rpc('admin_delete_user_account', { target_user_id: userId });
  return { success: !error, error: error?.message };
}

// Events
export async function fetchAdminEvents(search = '', status = '', offset = 0, limit = 20) {
  let query = supabase
    .from('events')
    .select('id, title, venue_name, start_time, status, participant_count, capacity, host_id, category_id, created_at, profiles!events_host_id_fkey(first_name)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.or(`title.ilike.%${search.replace(/[,.()\[\]]/g, '')}%,venue_name.ilike.%${search.replace(/[,.()\[\]]/g, '')}%`);
  }

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function updateEventStatus(eventId: string, status: 'active' | 'cancelled' | 'deleted') {
  const { error } = await supabase
    .from('events')
    .update({ status })
    .eq('id', eventId);
  return { success: !error, error: error?.message };
}

// Reports
export async function fetchAdminReports(status = '', offset = 0, limit = 20, reason = '') {
  let query = supabase
    .from('reports')
    .select(`
      id, reason, details, status, admin_notes, created_at, reviewed_at,
      host_review_id, guest_review_id, message_id, dm_message_id,
      reporter:profiles!reports_reporter_id_fkey(id, first_name, avatar_url),
      reported:profiles!reports_reported_user_id_fkey(id, first_name, avatar_url),
      event:events!reports_event_id_fkey(id, title),
      host_review:host_reviews!reports_host_review_id_fkey(id, host_rating, event_rating, comment, host_reply, host_replied_at, dispute_reason),
      guest_review:guest_reviews!reports_guest_review_id_fkey(id, guest_rating, comment, guest_reply, guest_replied_at, dispute_reason),
      message:messages!reports_message_id_fkey(id, content, created_at, sender_id),
      dm_message:direct_messages!reports_dm_message_id_fkey(id, content, created_at, sender_id, conversation_id)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }
  if (reason) {
    query = query.eq('reason', reason);
  }

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function updateReportStatus(
  reportId: string,
  status: 'reviewed' | 'dismissed' | 'actioned',
  adminNotes: string,
  reviewerId: string
) {
  const { error } = await supabase
    .from('reports')
    .update({
      status,
      admin_notes: adminNotes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq('id', reportId);
  return { success: !error, error: error?.message };
}

// Businesses (admin)
export async function fetchAdminBusinesses(
  search = '',
  filters: { status?: string } = {},
  offset = 0,
  limit = 30,
) {
  let query = supabase
    .from('businesses')
    .select('id, name, slug, logo_url, category, address, status, owner_id, created_at, owner:profiles!businesses_owner_id_fkey(first_name, email, avatar_url)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.status) query = query.eq('status', filters.status);
  if (search) {
    query = query.or(`name.ilike.%${search.replace(/[,.()\[\]]/g, '')}%,category.ilike.%${search.replace(/[,.()\[\]]/g, '')}%`);
  }

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export interface BusinessDetailBusiness {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  category: string;
  description: string | null;
  address: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  owner: { id: string; first_name: string | null; email: string; avatar_url: string | null } | null;
}
export interface BusinessDetailVoucher {
  id: string;
  title: string;
  discount_text: string;
  status: string;
  expires_at: string | null;
  redemption_count: number;
  redemption_limit: number | null;
  created_at: string;
}
export interface BusinessDetailEvent {
  id: string;
  title: string;
  status: string;
  start_time: string;
  participant_count: number;
  capacity: number;
  created_at: string;
}
export interface BusinessDetailRedemption {
  id: string;
  redeemed_at: string;
  voucher: { id: string; title: string } | null;
  user: { first_name: string | null; avatar_url: string | null } | null;
}

export async function getBusinessDetail(businessId: string) {
  const [{ data: business }, vouchers, events] = await Promise.all([
    supabase.from('businesses').select('*, owner:profiles!businesses_owner_id_fkey(id, first_name, email, avatar_url)').eq('id', businessId).single(),
    supabase.from('vouchers').select('id, title, discount_text, status, expires_at, redemption_count, redemption_limit, created_at', { count: 'exact' })
      .eq('business_id', businessId).order('created_at', { ascending: false }).limit(10),
    supabase.from('events').select('id, title, status, start_time, participant_count, capacity, created_at', { count: 'exact' })
      .eq('business_id', businessId).order('created_at', { ascending: false }).limit(10),
  ]);

  // Redemptions are joined through vouchers — query voucher IDs first, then redemptions.
  const voucherIdsRes = await supabase.from('vouchers').select('id').eq('business_id', businessId);
  const voucherIds = (voucherIdsRes.data ?? []).map((v) => v.id);
  const redemptions = voucherIds.length
    ? await supabase
        .from('voucher_redemptions')
        .select('id, redeemed_at, voucher:vouchers!voucher_id(id, title), user:profiles!voucher_redemptions_user_id_fkey(first_name, avatar_url)', { count: 'exact' })
        .in('voucher_id', voucherIds)
        .order('redeemed_at', { ascending: false })
        .limit(10)
    : { data: [], count: 0 };

  return {
    business: business as unknown as BusinessDetailBusiness | null,
    vouchers: {
      items: (vouchers.data ?? []) as unknown as BusinessDetailVoucher[],
      total: vouchers.count ?? 0,
    },
    redemptions: {
      items: (redemptions.data ?? []) as unknown as BusinessDetailRedemption[],
      total: redemptions.count ?? 0,
    },
    events: {
      items: (events.data ?? []) as unknown as BusinessDetailEvent[],
      total: events.count ?? 0,
    },
  };
}

export async function updateBusinessStatus(businessId: string, status: 'approved' | 'suspended' | 'inactive') {
  const { error } = await supabase.from('businesses').update({ status, updated_at: new Date().toISOString() }).eq('id', businessId);
  return { success: !error, error: error?.message };
}

// Business approval queue
export async function fetchPendingBusinesses(offset = 0, limit = 30) {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, slug, logo_url, category, description, address, status, owner_id, created_at, rejection_reason, owner:profiles!businesses_owner_id_fkey(id, first_name, email, avatar_url)')
    .in('status', ['pending_approval', 'rejected'])
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  return { data: data ?? [], error };
}

async function notifyBusinessOwner(ownerId: string, type: 'business_approved' | 'business_rejected', businessName: string, reason?: string) {
  await supabase.from('notifications').insert({
    user_id: ownerId,
    type,
    title: type === 'business_approved' ? 'Your business is approved' : 'Application not accepted',
    body: type === 'business_approved'
      ? `${businessName} is now live on Lincc. You can publish events and vouchers.`
      : `We couldn't approve ${businessName}. ${reason ? `Reason: ${reason}` : ''}`.trim(),
    data: { kind: type },
    is_read: false,
  });
}

export async function approveBusiness(businessId: string, adminId: string) {
  const { data: biz, error: fetchErr } = await supabase
    .from('businesses').select('id, name, owner_id').eq('id', businessId).single();
  if (fetchErr || !biz) return { success: false, error: fetchErr?.message ?? 'Business not found' };

  const { error } = await supabase.from('businesses').update({
    status: 'approved',
    rejection_reason: null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: adminId,
  }).eq('id', businessId);
  if (error) return { success: false, error: error.message };

  await logAdminAction(adminId, 'business.approve', 'business', businessId);
  if (biz.owner_id) await notifyBusinessOwner(biz.owner_id, 'business_approved', biz.name);
  return { success: true };
}

export async function rejectBusiness(businessId: string, adminId: string, reason: string) {
  const trimmed = reason.trim();
  if (!trimmed) return { success: false, error: 'A reason is required' };
  const { data: biz, error: fetchErr } = await supabase
    .from('businesses').select('id, name, owner_id').eq('id', businessId).single();
  if (fetchErr || !biz) return { success: false, error: fetchErr?.message ?? 'Business not found' };

  const { error } = await supabase.from('businesses').update({
    status: 'rejected',
    rejection_reason: trimmed,
    reviewed_at: new Date().toISOString(),
    reviewed_by: adminId,
  }).eq('id', businessId);
  if (error) return { success: false, error: error.message };

  await logAdminAction(adminId, 'business.reject', 'business', businessId, { reason: trimmed });
  if (biz.owner_id) await notifyBusinessOwner(biz.owner_id, 'business_rejected', biz.name, trimmed);
  return { success: true };
}

export async function exportBusinessesCSV() {
  const { data } = await supabase
    .from('businesses')
    .select('id, name, slug, category, address, status, owner_id, created_at')
    .order('created_at', { ascending: false });
  return data ?? [];
}

// Categories
export async function saveCategory(
  id: string | null,
  name: string,
  icon: string,
  value: string,
  sortOrder: number,
  parentId: string | null = null,
) {
  const payload = { name, icon, value, sort_order: sortOrder, parent_id: parentId };
  if (id) {
    const { error } = await supabase.from('categories').update(payload).eq('id', id);
    return { success: !error, error: error?.message };
  } else {
    const { error } = await supabase.from('categories').insert({ ...payload, is_active: true });
    return { success: !error, error: error?.message };
  }
}

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  return { success: !error, error: error?.message };
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  return { data: data ?? [], error };
}

// ============================================================
// IMAGE MANAGEMENT
// ============================================================

export type ImageBucket = 'avatars' | 'event-images' | 'business-logos';

export type AdminImage = {
  bucket: ImageBucket;
  path: string;
  name: string;
  publicUrl: string;
  size: number | null;
  updatedAt: string | null;
  ownerId: string | null;
  ownerName: string | null;
  ownerAvatar: string | null;
};

type StorageObject = {
  id: string | null;
  name: string;
  updated_at: string | null;
  created_at: string | null;
  metadata: { size?: number; mimetype?: string } | null;
};

async function listBucketRecursive(
  bucket: ImageBucket,
  prefix = '',
  limit = 500,
): Promise<{ path: string; name: string; size: number | null; updatedAt: string | null }[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit,
    sortBy: { column: 'updated_at', order: 'desc' },
  });
  if (error || !data) return [];

  const results: { path: string; name: string; size: number | null; updatedAt: string | null }[] = [];
  const folders: string[] = [];

  for (const entry of data as StorageObject[]) {
    if (entry.id === null) {
      folders.push(prefix ? `${prefix}/${entry.name}` : entry.name);
    } else {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      results.push({
        path,
        name: entry.name,
        size: entry.metadata?.size ?? null,
        updatedAt: entry.updated_at ?? entry.created_at ?? null,
      });
    }
  }

  for (const folder of folders) {
    const nested = await listBucketRecursive(bucket, folder, limit);
    results.push(...nested);
  }

  return results;
}

export async function fetchAdminImages(bucket: ImageBucket, limit = 200): Promise<AdminImage[]> {
  const objects = await listBucketRecursive(bucket, '', limit);
  if (objects.length === 0) return [];

  const sorted = objects
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    .slice(0, limit);

  // Owner is encoded as the first path segment for all three buckets.
  const ownerIds = Array.from(
    new Set(
      sorted
        .map((o) => o.path.split('/')[0])
        .filter((id): id is string => /^[0-9a-f-]{36}$/i.test(id ?? '')),
    ),
  );

  const ownerMap = new Map<string, { name: string | null; avatar: string | null }>();
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase
      .from('profiles')
      .select('id, first_name, avatar_url')
      .in('id', ownerIds);
    for (const o of owners ?? []) {
      ownerMap.set(o.id, { name: o.first_name ?? null, avatar: o.avatar_url ?? null });
    }
  }

  return sorted.map((o) => {
    const ownerId = /^[0-9a-f-]{36}$/i.test(o.path.split('/')[0] ?? '') ? o.path.split('/')[0] : null;
    const owner = ownerId ? ownerMap.get(ownerId) : undefined;
    return {
      bucket,
      path: o.path,
      name: o.name,
      publicUrl: supabase.storage.from(bucket).getPublicUrl(o.path).data.publicUrl,
      size: o.size,
      updatedAt: o.updatedAt,
      ownerId,
      ownerName: owner?.name ?? null,
      ownerAvatar: owner?.avatar ?? null,
    };
  });
}

export interface WaitlistEntry {
  id: string;
  email: string;
  name: string;
  is_business: boolean;
  business_name: string | null;
  business_type: string | null;
  created_at: string;
}

/**
 * Returns waitlist signups in reverse chronological order. Filtered server-side
 * by `is_business` so personal vs business tabs each get their own count.
 * Relies on the admin SELECT policy from migration 050.
 */
export async function fetchWaitlist(
  filter: 'personal' | 'business' | 'all' = 'all',
): Promise<{ data: WaitlistEntry[]; error: string | null }> {
  let query = supabase
    .from('waitlist')
    .select('id, email, name, is_business, business_name, business_type, created_at')
    .order('created_at', { ascending: false });
  if (filter === 'personal') query = query.eq('is_business', false);
  if (filter === 'business') query = query.eq('is_business', true);
  const { data, error } = await query;
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as WaitlistEntry[], error: null };
}

export async function deleteAdminImage(
  adminId: string,
  bucket: ImageBucket,
  path: string,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) return { success: false, error: error.message };

  // Best-effort: clear references on the owning row so the UI doesn't show a broken image.
  const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  if (bucket === 'avatars') {
    await supabase.from('profiles').update({ avatar_url: null }).eq('avatar_url', publicUrl);
  } else if (bucket === 'event-images') {
    await supabase.from('events').update({ cover_image_url: null }).eq('cover_image_url', publicUrl);
  } else if (bucket === 'business-logos') {
    await supabase.from('businesses').update({ logo_url: null }).eq('logo_url', publicUrl);
  }

  await logAdminAction(adminId, 'image.delete', 'image', undefined, { bucket, path });
  return { success: true };
}
