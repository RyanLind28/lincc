import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Camera, IdCard, FileText, UserCircle, ChevronLeft, CheckCircle,
  AlertTriangle, ShieldCheck, Loader2, Upload, MessageSquareWarning,
} from 'lucide-react';
import { Header } from '../components/layout';
import { Badge, GradientButton } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatRelativeTime } from '../lib/utils';
import {
  getMyVerification,
  uploadVerificationDoc,
  submitVerification,
  getDocSignedUrl,
  type VerificationDocSlot,
} from '../services/verificationService';
import { validateImageDetailed, convertHeicIfNeeded } from '../lib/imageCompression';
import * as Sentry from '@sentry/react';
import type { BusinessVerification } from '../types';

interface SlotConfig {
  key: VerificationDocSlot;
  column: keyof BusinessVerification;
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SLOTS: SlotConfig[] = [
  {
    key: 'operator_selfie',
    column: 'operator_selfie_path',
    title: 'Operator selfie',
    body: 'A clear photo of you, the person who runs this business. Daylight is best, no sunglasses.',
    icon: UserCircle,
  },
  {
    key: 'id_document',
    column: 'id_document_path',
    title: 'ID document',
    body: 'Passport, national ID, or driving licence. All four corners visible, no glare.',
    icon: IdCard,
  },
  {
    key: 'selfie_with_id',
    column: 'selfie_with_id_path',
    title: 'Selfie holding your ID',
    body: 'Hold your ID next to your face. We use this to confirm the ID belongs to you.',
    icon: Camera,
  },
  {
    key: 'registration_doc',
    column: 'registration_doc_path',
    title: 'Business registration',
    body: 'Trade licence, certificate of incorporation, or equivalent registration document.',
    icon: FileText,
  },
];

function SlotCard({
  slot,
  path,
  onUpload,
  isUploading,
  locked,
}: {
  slot: SlotConfig;
  path: string | null;
  onUpload: (file: File) => Promise<void> | void;
  isUploading: boolean;
  locked: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const Icon = slot.icon;

  useEffect(() => {
    let cancelled = false;
    if (!path) { setPreviewUrl(null); return; }
    getDocSignedUrl(path).then((url) => { if (!cancelled) setPreviewUrl(url); });
    return () => { cancelled = true; };
  }, [path]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Defer the input reset until after the upload pipeline has read the
    // file — clearing `input.value` while bytes are still being read can
    // revoke the picker's Content URI permission on Samsung Android.
    try {
      await onUpload(file);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const isImage = path && /\.(jpe?g|png|webp|gif|heic)$/i.test(path);
  const inputId = `verify-doc-${slot.key}`;
  const disabled = locked || isUploading;

  return (
    <div className="bg-surface rounded-2xl border border-border p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-coral" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-text">{slot.title}</p>
            {path && <Badge size="sm" variant="success">Uploaded</Badge>}
          </div>
          <p className="text-xs text-text-muted mt-0.5">{slot.body}</p>
        </div>
      </div>

      {path && (
        <div className="mt-3 rounded-lg overflow-hidden border border-border bg-background">
          {isImage && previewUrl ? (
            <img src={previewUrl} alt={slot.title} className="w-full max-h-64 object-contain" />
          ) : (
            <div className="p-3 text-xs text-text-muted flex items-center gap-2">
              <FileText className="h-4 w-4" /> {path.split('/').pop()}
              {previewUrl && <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-coral ml-auto">View</a>}
            </div>
          )}
        </div>
      )}

      <div className="mt-3">
        {/* Hidden but kept in layout — `display:none` breaks programmatic .click()
            on iOS Safari, so we use sr-only and trigger via <label htmlFor>. */}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFile}
          className="sr-only"
          disabled={disabled}
        />
        <label
          htmlFor={inputId}
          aria-disabled={disabled}
          className={`w-full flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-dashed border-border text-sm font-medium transition-colors ${
            disabled
              ? 'opacity-50 cursor-not-allowed text-text-muted'
              : 'text-text-muted hover:border-coral hover:text-coral cursor-pointer'
          }`}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {path ? 'Replace' : 'Upload'}
        </label>
      </div>
    </div>
  );
}

export default function BusinessVerifyPage() {
  const { user, business, profile, refreshBusiness } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [verification, setVerification] = useState<BusinessVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingSlot, setUploadingSlot] = useState<VerificationDocSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (!business?.id) return;
    const v = await getMyVerification(business.id);
    setVerification(v);
    setIsLoading(false);
  }, [business?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  if (profile && profile.account_type !== 'business') {
    return <Navigate to="/" replace />;
  }
  if (!business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-coral animate-spin" />
      </div>
    );
  }

  const handleUpload = async (slot: VerificationDocSlot, file: File) => {
    if (!user?.id || !business.id) return;
    setUploadingSlot(slot);

    // Image files (the three photo slots) get the same hardening as the rest
    // of the app: validation reads bytes through a recovery cascade so flaky
    // Android Content URIs still work, and HEIC files get converted before
    // upload. Registration docs are often PDFs, so skip validation when it's
    // not an image MIME.
    let workingFile = file;
    const isImage = file.type.startsWith('image/');
    if (isImage) {
      const validation = await validateImageDetailed(file);
      if (validation.recovered) {
        Sentry.captureMessage('verification-doc: recovered unreadable file', {
          level: 'info',
          extra: { slot, fileType: file.type, fileSize: file.size, recoveredSize: validation.file.size },
        });
      }
      if (!validation.ok) {
        Sentry.captureMessage('verification-doc: validation rejected file', {
          level: 'info',
          extra: { slot, reason: validation.error, fileType: file.type, fileSize: file.size },
        });
        setUploadingSlot(null);
        showToast(validation.error, 'error');
        return;
      }
      workingFile = validation.file;
      if (validation.format === 'heic') {
        try {
          workingFile = await convertHeicIfNeeded(workingFile, 'heic');
        } catch (err) {
          Sentry.captureException(err, {
            tags: { feature: 'verification-doc', stage: 'heic-convert' },
            extra: { slot, fileType: workingFile.type, fileSize: workingFile.size },
          });
          setUploadingSlot(null);
          showToast(
            "Couldn't convert this iPhone photo. Try saving it as a JPEG and uploading again.",
            'error',
          );
          return;
        }
      }
    }

    const result = await uploadVerificationDoc(business.id, user.id, slot, workingFile);
    if (result.success) {
      // Await the refresh so the SlotCard re-renders with the new path before
      // we drop the uploading state — otherwise the user can hit "Replace"
      // again on stale data and confuse the picker on Samsung Internet.
      await refresh();
      setUploadingSlot(null);
      showToast('Uploaded', 'success');
    } else {
      setUploadingSlot(null);
      Sentry.captureMessage('verification-doc: upload failed', {
        level: 'error',
        extra: { slot, error: result.error, fileType: file.type, fileSize: file.size },
      });
      showToast(result.error || 'Upload failed', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!verification) return;
    setIsSubmitting(true);
    const result = await submitVerification(verification.id);
    setIsSubmitting(false);
    if (result.success) {
      showToast('Sent for review — we\'ll be in touch', 'success');
      refresh();
      refreshBusiness();
      navigate('/business/dashboard');
    } else {
      showToast(result.error || 'Submission failed', 'error');
    }
  };

  const status = verification?.status ?? 'draft';
  const canEdit = status === 'draft' || status === 'rejected';
  const allUploaded = SLOTS.every((s) => !!verification?.[s.column]);

  return (
    <div className="min-h-screen bg-background pb-12 max-w-2xl mx-auto">
      <Header
        showBack
        rightContent={
          <Link to="/business/dashboard" className="text-sm text-coral font-medium px-3">
            Skip for now
          </Link>
        }
      />

      <div className="p-4 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-coral" />
            <h1 className="text-2xl font-bold text-text">Verify your business</h1>
          </div>
          <p className="text-sm text-text-muted">
            Verified businesses get an official tick on their profile, helping guests trust who they're dealing with. We never share these documents.
          </p>
        </div>

        {/* Status banner */}
        {isLoading ? (
          <div className="h-16 bg-surface rounded-2xl border border-border animate-pulse" />
        ) : status === 'submitted' || status === 'in_review' ? (
          <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 flex items-start gap-3">
            <Loader2 className="h-5 w-5 text-warning mt-0.5 animate-spin" />
            <div>
              <p className="text-sm font-semibold text-text">Under review</p>
              <p className="text-xs text-text-muted">We're checking your documents. Most reviews finish within 24 hours.</p>
            </div>
          </div>
        ) : status === 'approved' ? (
          <div className="bg-success/10 border border-success/30 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-success mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-success">Verified</p>
              <p className="text-xs text-text-muted">Your business now displays the official tick across Lincc.</p>
            </div>
          </div>
        ) : status === 'rejected' ? (
          <div className="bg-error/10 border border-error/30 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-error mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-error">More info needed</p>
              <p className="text-xs text-text-muted mt-1">Check the admin's notes below, replace any flagged documents, and re-submit.</p>
            </div>
          </div>
        ) : null}

        {/* Admin feedback — shown when the reviewer left notes (typically on
            rejection, but also when notes accompany an approval). Always
            visible while notes exist so the user knows what to act on. */}
        {!isLoading && verification?.rejection_notes?.trim() && (
          <div className="rounded-2xl border border-error/30 bg-error/5 overflow-hidden">
            <div className="px-4 py-2.5 bg-error/10 border-b border-error/20 flex items-center gap-2">
              <MessageSquareWarning className="h-4 w-4 text-error flex-shrink-0" />
              <p className="text-sm font-semibold text-error">Reviewer's notes</p>
              {verification.reviewed_at && (
                <span className="ml-auto text-[11px] text-text-muted">
                  {formatRelativeTime(verification.reviewed_at)}
                </span>
              )}
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-text whitespace-pre-wrap">{verification.rejection_notes}</p>
              {status === 'rejected' && (
                <p className="text-xs text-text-muted">
                  Replace the documents flagged above and tap <span className="font-medium">Re-submit for review</span> when you're done.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Slots */}
        <div className="space-y-3">
          {SLOTS.map((slot) => (
            <SlotCard
              key={slot.key}
              slot={slot}
              path={(verification?.[slot.column] as string | null) ?? null}
              isUploading={uploadingSlot === slot.key}
              locked={!canEdit}
              onUpload={(file) => handleUpload(slot.key, file)}
            />
          ))}
        </div>

        {/* Submit */}
        {canEdit && (
          <GradientButton
            fullWidth
            onClick={handleSubmit}
            disabled={!allUploaded}
            isLoading={isSubmitting}
          >
            {status === 'rejected' ? 'Re-submit for review' : 'Submit for review'}
          </GradientButton>
        )}

        {!canEdit && status !== 'approved' && (
          <div className="text-center text-xs text-text-muted">
            Submitted — locked while we review.
          </div>
        )}

        <p className="text-[11px] text-text-light leading-relaxed">
          Documents are stored privately. Only Lincc admins reviewing your application can access them, and we delete them within 90 days of approval (sooner on request).
        </p>

        <Link
          to="/business/dashboard"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
        >
          <ChevronLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    </div>
  );
}
