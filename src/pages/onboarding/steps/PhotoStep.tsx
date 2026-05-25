import { Avatar, ImagePickerButtons } from '../../../components/ui';
import { Camera, Loader2 } from 'lucide-react';
import type { RefObject } from 'react';

interface PhotoStepProps {
  avatarUrl: string | null;
  firstName: string;
  isRecovering: boolean;
  photoError: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearError: () => void;
}

export function PhotoStep({
  avatarUrl,
  firstName,
  isRecovering,
  photoError,
  fileInputRef,
  onPhotoSelect,
  onClearError,
}: PhotoStepProps) {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold gradient-text mb-2">Add a photo</h1>
      <p className="text-text-muted mb-8">
        Help others recognise you, or skip to use your initials.
      </p>

      <div className="flex flex-col items-center gap-4">
        <label className="cursor-pointer">
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
            accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
            onChange={onPhotoSelect}
            className="hidden"
          />
        </label>

        {!isRecovering && !photoError && (
          <ImagePickerButtons
            fileInputRef={fileInputRef}
            onCameraSelect={onPhotoSelect}
          />
        )}

        <p className="text-xs text-text-muted">
          {isRecovering
            ? 'Fetching photo from cloud, this can take a few seconds…'
            : 'Optional. Max 25MB.'}
        </p>

        {photoError && (
          <div className="w-full text-left bg-error/5 border border-error/20 rounded-xl p-4 mt-2">
            <p className="text-sm font-semibold text-error mb-2">
              Couldn't use this photo
            </p>
            <p className="text-sm text-text-muted mb-3 leading-relaxed">
              {photoError}
            </p>
            {/cloud|downloaded/i.test(photoError) && (
              <div className="text-xs text-text-muted bg-background rounded-lg p-3 mb-3 leading-relaxed">
                <p className="font-semibold text-text mb-1">On Samsung:</p>
                <ol className="list-decimal pl-4 space-y-0.5">
                  <li>Open <span className="font-medium">Samsung Gallery</span></li>
                  <li>Tap the photo you want to use</li>
                  <li>Tap the <span className="font-medium">cloud icon</span> to download it to the device</li>
                  <li>Come back here and tap your avatar to try again</li>
                </ol>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  onClearError();
                  fileInputRef.current?.click();
                }}
                className="text-sm font-semibold text-coral hover:text-coral-dark"
              >
                Try a different photo →
              </button>
              <label className="text-sm font-semibold text-purple hover:text-purple-dark cursor-pointer">
                Take a photo instead
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={onPhotoSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
