import { Camera, ImagePlus } from 'lucide-react';
import type { RefObject } from 'react';

interface ImagePickerButtonsProps {
  /** Kept for backward-compat / other triggers; the gallery button no longer
   *  relies on it. */
  fileInputRef?: RefObject<HTMLInputElement | null>;
  /** Escape hatch: if set, the gallery button calls this instead of opening its
   *  own label-wrapped input. */
  onGalleryClick?: () => void;
  /** Handler for a picked file — used by BOTH gallery and camera inputs. */
  onCameraSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  galleryLabel?: string;
  cameraLabel?: string;
  size?: 'sm' | 'md';
  showCamera?: boolean;
  /** Which camera the capture input opens. 'user' = front (selfies). */
  capture?: 'user' | 'environment';
  /** accept attribute for the gallery input. */
  accept?: string;
}

export function ImagePickerButtons({
  fileInputRef: _fileInputRef,
  onGalleryClick,
  onCameraSelect,
  galleryLabel = 'Choose from gallery',
  cameraLabel = 'Take a photo',
  size = 'md',
  showCamera = true,
  capture = 'environment',
  accept = 'image/*,.heic,.heif',
}: ImagePickerButtonsProps) {
  const height = size === 'sm' ? 'h-[var(--height-button-sm)]' : 'h-12';
  const text = size === 'sm' ? 'text-xs' : 'text-sm';
  const iconBox = size === 'sm' ? 'h-5 w-5' : 'h-7 w-7';
  const icon = size === 'sm' ? 'h-3 w-3' : 'h-[17px] w-[17px]';

  // Shared shell: each button fills its half of the row (or full width when
  // stacked on mobile), with a tinted icon chip that flips to a solid fill on
  // hover. Gallery leans coral, camera leans purple — same accent split the
  // rest of the picker UI uses.
  const base = `group flex w-full sm:flex-1 items-center justify-center gap-2.5 ${height} px-3 rounded-2xl border border-border bg-surface ${text} font-semibold text-text transition-all duration-200 press-effect cursor-pointer`;
  const chip = `flex ${iconBox} items-center justify-center rounded-full transition-colors`;

  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full">
      {/* Gallery — label-wrapped input, NOT a programmatic fileInputRef.click().
          On Samsung Internet/Android Chrome a programmatic .click() on a file
          input elsewhere in the DOM silently no-ops (esp. after returning from
          another picker), so "Choose photo" did nothing. A native label tap on
          its own input is the reliable path — same pattern the camera uses. */}
      {onGalleryClick ? (
        <button
          type="button"
          onClick={onGalleryClick}
          className={`${base} hover:border-coral hover:bg-coral/5 hover:text-coral`}
        >
          <span className={`${chip} bg-coral/10 text-coral group-hover:bg-coral group-hover:text-white`}>
            <ImagePlus className={icon} />
          </span>
          {galleryLabel}
        </button>
      ) : (
        <label className={`${base} hover:border-coral hover:bg-coral/5 hover:text-coral`}>
          <span className={`${chip} bg-coral/10 text-coral group-hover:bg-coral group-hover:text-white`}>
            <ImagePlus className={icon} />
          </span>
          {galleryLabel}
          <input
            type="file"
            accept={accept}
            onChange={onCameraSelect}
            className="sr-only"
          />
        </label>
      )}
      {showCamera && (
        <label className={`${base} hover:border-purple hover:bg-purple/5 hover:text-purple`}>
          <span className={`${chip} bg-purple/10 text-purple group-hover:bg-purple group-hover:text-white`}>
            <Camera className={icon} />
          </span>
          {cameraLabel}
          <input
            type="file"
            accept="image/*"
            capture={capture}
            onChange={onCameraSelect}
            className="sr-only"
          />
        </label>
      )}
    </div>
  );
}
