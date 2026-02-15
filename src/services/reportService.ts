import { supabase } from '../lib/supabase';

export const REPORT_REASONS = [
  { value: 'inappropriate', label: 'Inappropriate behaviour' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'spam', label: 'Spam or fake profile' },
  { value: 'safety', label: 'Safety concern' },
  { value: 'other', label: 'Other' },
] as const;

interface ReportInput {
  reporterId: string;
  reportedUserId: string;
  eventId?: string;
  reason: string;
  details?: string;
}

export async function submitReport(input: ReportInput) {
  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: input.reporterId,
      reported_user_id: input.reportedUserId,
      event_id: input.eventId || null,
      reason: input.reason,
      details: input.details || null,
    });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
