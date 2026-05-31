import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera, IdCard, FileText, UserCircle, Loader2, Upload, X,
} from 'lucide-react';
import * as Sentry from '@sentry/react';
import { Badge } from '../ui';
import { useToast } from '../../contexts/ToastContext';
import {
  uploadVerificationDoc,
  removeVerificationDoc,
  getDocSignedUrl,
  type VerificationDocSlot,
} from '../../services/verificationService';
import { validateImageDetailed, convertHeicIfNeeded } from '../../lib/imageCompression';
import type { BusinessVerification } from '../../types';

interface SlotConfig {
  key: VerificationDocSlot;
  column: keyof BusinessVerification;
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const VERIFICATION_SLOTS: SlotConfig[] = [
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
  onRemove,
  isUploading,
  locked,
}: {
  slot: SlotConfig;
  path: string | null;
  onUpload: (file: File) => Promise<void> | void;
  onRemove?: () => void;
  isUploading: boolean;
  locked: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Optimistic preview from the just-picked File. Rendered immediately so the
  // user sees their selection while the upload + signed-URL round-trip runs;
  // we've seen the signed URL fetch occasionally fail right after upload
  // (storage consistency lag), and only a refresh recovers — this side-steps
  // that entirely and also makes the picker feel instant.
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const Icon = slot.icon;
  const showCamera = slot.key !== 'registration_doc';

  useEffect(() => {
    let cancelled = false;
    if (!path) { setPreviewUrl(null); return; }
    getDocSignedUrl(path).then((url) => {
      if (cancelled) return;
      setPreviewUrl(url);
      // Signed URL is now the source of truth — drop the blob URL so we
      // don't keep a stale local copy around.
      setLocalPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    });
    return () => { cancelled = true; };
  }, [path]);

  // Revoke the local preview URL when the component unmounts.
  useEffect(() => () => {
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
  }, [localPreviewUrl]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show the picked file instantly. The signed-URL fetch swap happens
    // once `path` updates from the parent's refresh.
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setLocalPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    }
    // Defer the input reset until after the upload pipeline has read the
    // file — clearing input.value while bytes are still being read can
    // revoke the picker's Content URI permission on Samsung Android.
    try {
      await onUpload(file);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const displayUrl = localPreviewUrl ?? previewUrl;
  const isImage = !!localPreviewUrl || (path && /\.(jpe?g|png|webp|gif|heic)$/i.test(path));
  const hasContent = !!(path || localPreviewUrl);
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

      {hasContent && (
        <div className="mt-3 rounded-lg overflow-hidden border border-border bg-background relative group">
          {isImage && displayUrl ? (
            <img src={displayUrl} alt={slot.title} className="w-full max-h-64 object-contain" />
          ) : (
            <div className="p-3 text-xs text-text-muted flex items-center gap-2">
              <FileText className="h-4 w-4" /> {path?.split('/').pop() ?? 'New file'}
              {previewUrl && <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-coral ml-auto">View</a>}
            </div>
          )}
          {path && onRemove && !disabled && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-error/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error shadow-md"
              aria-label={`Remove ${slot.title}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="mt-3 flex gap-2">
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
          className={`flex-1 flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-dashed border-border text-sm font-medium transition-colors ${
            disabled
              ? 'opacity-50 cursor-not-allowed text-text-muted'
              : 'text-text-muted hover:border-coral hover:text-coral cursor-pointer'
          }`}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {path ? 'Replace' : 'Upload'}
        </label>
        {/* Keep the camera input mounted whenever the slot supports it, even
            while uploading — unmounting it mid-read (the moment isUploading
            flips true) revokes the captured photo's content:// URI on Android,
            so the selfie/ID shot never uploads. Disable rather than remove. */}
        {showCamera && (
          <label
            aria-disabled={disabled}
            className={`flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-dashed border-border text-sm font-medium transition-colors ${
              disabled
                ? 'opacity-50 cursor-not-allowed text-text-muted'
                : 'text-text-muted hover:border-purple hover:text-purple cursor-pointer'
            }`}
          >
            <Camera className="h-4 w-4" />
            Camera
            <input
              type="file"
              accept="image/*"
              capture={slot.key === 'operator_selfie' || slot.key === 'selfie_with_id' ? 'user' : 'environment'}
              onChange={handleFile}
              className="hidden"
              disabled={disabled}
            />
          </label>
        )}
      </div>
    </div>
  );
}

/**
 * Hook owning the upload pipeline: validation + HEIC conversion + Sentry
 * telemetry + storage upload. Returns the per-slot state and a handler that
 * the slots list can call.
 */
export function useVerificationUpload(
  businessId: string | undefined,
  ownerId: string | undefined,
  onUploaded: () => Promise<void> | void,
) {
  const { showToast } = useToast();
  const [uploadingSlot, setUploadingSlot] = useState<VerificationDocSlot | null>(null);

  const handleUpload = useCallback(async (slot: VerificationDocSlot, file: File) => {
    if (!ownerId || !businessId) return;
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
      if (!validation.ok) {
        Sentry.captureMessage('verification-doc: validation rejected file', {
          level: 'info',
          extra: {
            slot,
            reason: validation.error,
            fileType: file.type,
            fileSize: file.size,
            arrayBufferError: validation.arrayBufferError,
            recoveryAttempts: validation.recoveryAttempts,
          },
        });
        setUploadingSlot(null);
        showToast(validation.error, 'error');
        return;
      }
      if (validation.recovered) {
        Sentry.captureMessage('verification-doc: recovered unreadable file', {
          level: 'info',
          extra: {
            slot,
            fileType: file.type,
            fileSize: file.size,
            recoveredSize: validation.file.size,
            arrayBufferError: validation.arrayBufferError,
            recoveryAttempts: validation.recoveryAttempts,
          },
        });
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

    const result = await uploadVerificationDoc(businessId, ownerId, slot, workingFile);
    if (result.success) {
      // Await refresh so the slot re-renders with the new path before we drop
      // the uploading state — otherwise the user can hit "Replace" on stale
      // data and confuse the picker on Samsung Internet.
      await onUploaded();
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
  }, [ownerId, businessId, onUploaded, showToast]);

  const handleRemove = useCallback(async (slot: VerificationDocSlot, currentPath: string) => {
    if (!businessId) return;
    setUploadingSlot(slot);
    const result = await removeVerificationDoc(businessId, slot, currentPath);
    if (result.success) {
      await onUploaded();
      setUploadingSlot(null);
      showToast('Removed', 'info');
    } else {
      setUploadingSlot(null);
      showToast(result.error || 'Failed to remove', 'error');
    }
  }, [businessId, onUploaded, showToast]);

  return { uploadingSlot, handleUpload, handleRemove };
}

interface VerificationSlotsProps {
  verification: BusinessVerification | null;
  uploadingSlot: VerificationDocSlot | null;
  locked: boolean;
  onUpload: (slot: VerificationDocSlot, file: File) => void;
  onRemove?: (slot: VerificationDocSlot, currentPath: string) => void;
}

export function VerificationSlots({
  verification,
  uploadingSlot,
  locked,
  onUpload,
  onRemove,
}: VerificationSlotsProps) {
  return (
    <div className="space-y-3">
      {VERIFICATION_SLOTS.map((slot) => {
        const path = (verification?.[slot.column] as string | null) ?? null;
        return (
          <SlotCard
            key={slot.key}
            slot={slot}
            path={path}
            isUploading={uploadingSlot === slot.key}
            locked={locked}
            onUpload={(file) => onUpload(slot.key, file)}
            onRemove={path && onRemove ? () => onRemove(slot.key, path) : undefined}
          />
        );
      })}
    </div>
  );
}
