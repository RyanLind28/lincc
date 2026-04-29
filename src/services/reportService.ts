import { supabase } from '../lib/supabase';

export const REPORT_REASONS = [
  { value: 'inappropriate', label: 'Inappropriate behaviour' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'spam', label: 'Spam or fake profile' },
  { value: 'safety', label: 'Safety concern' },
  { value: 'other', label: 'Other' },
] as const;

export const CHAT_REPORT_REASONS = [
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate', label: 'Inappropriate / sexual content' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'hate', label: 'Hate speech or threats' },
  { value: 'safety', label: 'Safety concern' },
  { value: 'other', label: 'Other' },
] as const;

interface ReportInput {
  reporterId: string;
  reportedUserId: string;
  eventId?: string;
  reason: string;
  details?: string;
  /** Event-chat message id (from `messages` table) */
  messageId?: string;
  /** Direct-message id (from `direct_messages` table) */
  dmMessageId?: string;
}

export async function submitReport(input: ReportInput) {
  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: input.reporterId,
      reported_user_id: input.reportedUserId,
      event_id: input.eventId || null,
      message_id: input.messageId || null,
      dm_message_id: input.dmMessageId || null,
      reason: input.reason,
      details: input.details || null,
    });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
