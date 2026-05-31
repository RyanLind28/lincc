import { supabase } from '../lib/supabase';
import type { ReportContext } from '../lib/reportContext';

export interface SubmitFeedbackInput {
  userId: string;
  /** 'bug' | 'support' | 'feedback' | 'feature_request' */
  type: string;
  subject: string;
  body: string;
  context?: ReportContext | null;
}

/**
 * Inserts a feedback / problem report. RLS requires user_id = auth.uid().
 * A bug/support insert fires the admin-alert trigger (migration 061).
 */
export async function submitFeedback(
  input: SubmitFeedbackInput,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('feedback').insert({
    user_id: input.userId,
    type: input.type,
    subject: input.subject,
    body: input.body,
    context: input.context ?? null,
  });
  return { success: !error, error: error?.message };
}

export interface AdminFeedbackRow {
  id: string;
  user_id: string;
  type: string;
  subject: string;
  body: string;
  status: string;
  admin_notes: string | null;
  context: ReportContext | null;
  created_at: string | null;
  user?: { id: string; first_name: string | null; avatar_url: string | null } | null;
}

/** Admin-only list (RLS: admins can manage all feedback). */
export async function fetchAdminFeedback(
  status = '',
  type = '',
  limit = 100,
): Promise<{ data: AdminFeedbackRow[]; error?: string }> {
  let query = supabase
    .from('feedback')
    .select(
      'id, user_id, type, subject, body, status, admin_notes, context, created_at, user:profiles!feedback_user_id_fkey(id, first_name, avatar_url)',
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) query = query.eq('status', status);
  if (type) query = query.eq('type', type);

  const { data, error } = await query;
  return { data: (data as unknown as AdminFeedbackRow[]) ?? [], error: error?.message };
}

export async function updateFeedbackStatus(
  id: string,
  status: string,
  adminNotes: string,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('feedback')
    .update({ status, admin_notes: adminNotes || null })
    .eq('id', id);
  return { success: !error, error: error?.message };
}
