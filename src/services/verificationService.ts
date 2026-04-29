import { supabase } from '../lib/supabase';
import { logger } from '../lib/utils';
import type { BusinessVerification } from '../types';

export type VerificationDocSlot =
  | 'operator_selfie'
  | 'id_document'
  | 'selfie_with_id'
  | 'registration_doc';

const COLUMN_FOR_SLOT: Record<VerificationDocSlot, keyof BusinessVerification> = {
  operator_selfie: 'operator_selfie_path',
  id_document: 'id_document_path',
  selfie_with_id: 'selfie_with_id_path',
  registration_doc: 'registration_doc_path',
};

const BUCKET = 'business-verification-docs';

export async function getMyVerification(businessId: string): Promise<BusinessVerification | null> {
  const { data, error } = await supabase
    .from('business_verifications')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle();
  if (error) {
    logger.error('getMyVerification error', error);
    return null;
  }
  return (data as BusinessVerification | null) ?? null;
}

async function ensureRow(businessId: string): Promise<BusinessVerification | null> {
  const existing = await getMyVerification(businessId);
  if (existing) return existing;
  const { data, error } = await supabase
    .from('business_verifications')
    .insert({ business_id: businessId, status: 'draft' })
    .select('*')
    .single();
  if (error) {
    logger.error('ensureRow error', error);
    return null;
  }
  return data as BusinessVerification;
}

export async function uploadVerificationDoc(
  businessId: string,
  ownerId: string,
  slot: VerificationDocSlot,
  file: File,
): Promise<{ success: boolean; error?: string; path?: string }> {
  const row = await ensureRow(businessId);
  if (!row) return { success: false, error: 'Could not start verification' };

  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const path = `${ownerId}/${businessId}/${slot}-${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });
  if (uploadErr) return { success: false, error: uploadErr.message };

  const { error: updateErr } = await supabase
    .from('business_verifications')
    .update({ [COLUMN_FOR_SLOT[slot]]: path })
    .eq('id', row.id);
  if (updateErr) return { success: false, error: updateErr.message };

  return { success: true, path };
}

export async function submitVerification(verificationId: string) {
  const { error } = await supabase
    .from('business_verifications')
    .update({ status: 'submitted', submitted_at: new Date().toISOString(), rejection_notes: null })
    .eq('id', verificationId);
  return { success: !error, error: error?.message };
}

/**
 * Resolves a stored storage path into a short-lived signed URL the caller can
 * render in an <img>. Works for owners (their own folder) and admins
 * (everything in the bucket) per the policies set in migration 047.
 */
export async function getDocSignedUrl(path: string, expiresInSeconds = 60 * 60): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error) {
    logger.error('signed URL error', error);
    return null;
  }
  return data?.signedUrl ?? null;
}

// ---- Admin ----

export async function fetchVerificationsForReview() {
  const { data, error } = await supabase
    .from('business_verifications')
    .select('*, business:businesses!business_id(id, name, owner_id, status, verified)')
    .in('status', ['submitted', 'in_review', 'rejected'])
    .order('submitted_at', { ascending: true });
  return { data: data ?? [], error };
}

export async function approveVerification(verificationId: string, businessId: string, adminId: string) {
  const now = new Date().toISOString();
  const { error: vErr } = await supabase
    .from('business_verifications')
    .update({
      status: 'approved',
      reviewed_at: now,
      reviewed_by: adminId,
      rejection_notes: null,
    })
    .eq('id', verificationId);
  if (vErr) return { success: false, error: vErr.message };

  const { error: bErr } = await supabase
    .from('businesses')
    .update({ verified: true, verified_at: now })
    .eq('id', businessId);
  if (bErr) return { success: false, error: bErr.message };

  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action: 'business.verify',
    target_type: 'business',
    target_id: businessId,
    details: { verification_id: verificationId },
  });

  return { success: true };
}

export async function rejectVerification(verificationId: string, adminId: string, notes: string) {
  const trimmed = notes.trim();
  if (!trimmed) return { success: false, error: 'A reason is required' };
  const { error } = await supabase
    .from('business_verifications')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      rejection_notes: trimmed,
    })
    .eq('id', verificationId);
  if (error) return { success: false, error: error.message };

  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action: 'business.verify_reject',
    target_type: 'business_verification',
    target_id: verificationId,
    details: { notes: trimmed },
  });

  return { success: true };
}
