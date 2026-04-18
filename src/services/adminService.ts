import { supabase } from '../lib/supabase';

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
    .select('id, email, first_name, gender, role, status, is_business, created_at')
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
  targetType: 'user' | 'event' | 'report' | 'category',
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
    eventsHosted: { items: hosted.data ?? [], total: hosted.count ?? 0 },
    eventsJoined: { items: joined.data ?? [], total: joined.count ?? 0 },
    messagesTotal: msgCount.count ?? 0,
    reportsFiled: { items: filedReports.data ?? [], total: filedReports.count ?? 0 },
    reportsReceived: { items: receivedReports.data ?? [], total: receivedReports.count ?? 0 },
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
    .select('id, email, first_name, avatar_url, gender, role, status, tags, is_flagged, is_business, created_at')
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
export async function fetchAdminReports(status = '', offset = 0, limit = 20) {
  let query = supabase
    .from('reports')
    .select(`
      id, reason, details, status, admin_notes, created_at, reviewed_at,
      reporter:profiles!reports_reporter_id_fkey(id, first_name, avatar_url),
      reported:profiles!reports_reported_user_id_fkey(id, first_name, avatar_url),
      event:events!reports_event_id_fkey(id, title)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
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
    business,
    vouchers: { items: vouchers.data ?? [], total: vouchers.count ?? 0 },
    redemptions: { items: redemptions.data ?? [], total: redemptions.count ?? 0 },
    events: { items: events.data ?? [], total: events.count ?? 0 },
  };
}

export async function updateBusinessStatus(businessId: string, status: 'active' | 'suspended') {
  const { error } = await supabase.from('businesses').update({ status, updated_at: new Date().toISOString() }).eq('id', businessId);
  return { success: !error, error: error?.message };
}

export async function exportBusinessesCSV() {
  const { data } = await supabase
    .from('businesses')
    .select('id, name, slug, category, address, status, owner_id, created_at')
    .order('created_at', { ascending: false });
  return data ?? [];
}

// Categories
export async function saveCategory(id: string | null, name: string, icon: string, value: string, sortOrder: number) {
  if (id) {
    const { error } = await supabase
      .from('categories')
      .update({ name, icon, value, sort_order: sortOrder })
      .eq('id', id);
    return { success: !error, error: error?.message };
  } else {
    const { error } = await supabase
      .from('categories')
      .insert({ name, icon, value, sort_order: sortOrder, is_active: true });
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
