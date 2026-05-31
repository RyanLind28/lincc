import { Avatar, ImagePickerButtons, UploadErrorNotice } from '../../../components/ui';
import { Camera, Loader2, X } from 'lucide-react';
import type { RefObject } from 'react';

interface PhotoStepProps {
  avatarUrl: string | null;
  firstName: string;
  isRecovering: boolean;
  photoError: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearError: () => void;
  onRemovePhoto: () => void;
}

export function PhotoStep({
  avatarUrl,
  firstName,
  isRecovering,
  photoError,
  fileInputRef,
  onPhotoSelect,
  onClearError,
  onRemovePhoto,
}: PhotoStepProps) {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold gradient-text mb-2">Add a photo</h1>
      <p className="text-text-muted mb-8">
        Help others recognise you, or skip to use your initials.
      </p>

      <div className="flex flex-col items-center gap-4">
        {/* The avatar itself opens the picker. The remove badge is a sibling of
            the label (not nested inside it) so tapping it clears the photo
            instead of re-triggering the file input. */}
        <div className="relative">
          <label className="cursor-pointer block">
            <div className="relative">
              <Avatar src={avatarUrl} name={firstName || 'You'} size="xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 gradient-primary rounded-full flex items-center justify-center shadow-md">
                {isRecovering ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 text-white" />
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              id="onboarding-avatar-input"
              type="file"
              accept="image/*"
              onChange={onPhotoSelect}
              className="sr-only"
            />
          </label>

          {avatarUrl && !isRecovering && (
            <button
              type="button"
              onClick={onRemovePhoto}
              aria-label="Remove photo"
              className="absolute -top-1 -right-1 w-7 h-7 bg-error rounded-full flex items-center justify-center text-white shadow-md border-2 border-surface press-effect"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Gallery + Selfie are always available — the photo is optional, so a
            failed pick should never hide the way to try a different source. The
            'Skip for now' nav button below also lets the user move on. */}
        <ImagePickerButtons
          fileInputRef={fileInputRef}
          onCameraSelect={onPhotoSelect}
          galleryLabel="Gallery"
          cameraLabel="Selfie"
          capture="user"
        />

        <p className="text-xs text-text-muted">
          {isRecovering
            ? 'Fetching photo from cloud, this can take a few seconds…'
            : 'Optional. Max 25MB.'}
        </p>

        {photoError && (
          <UploadErrorNotice
            message={photoError}
            retryLabel="Try again"
            skipLabel="Skip photo"
            onRetry={() => {
              onClearError();
              fileInputRef.current?.click();
            }}
            onSkip={onClearError}
            reportSource="onboarding-avatar"
          />
        )}
      </div>
    </div>
  );
}
