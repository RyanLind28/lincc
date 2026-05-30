import { Camera, ImagePlus } from 'lucide-react';
import type { RefObject } from 'react';

interface ImagePickerButtonsProps {
  fileInputRef?: RefObject<HTMLInputElement | null>;
  onGalleryClick?: () => void;
  onCameraSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  galleryLabel?: string;
  cameraLabel?: string;
  size?: 'sm' | 'md';
  showCamera?: boolean;
}

export function ImagePickerButtons({
  fileInputRef,
  onGalleryClick,
  onCameraSelect,
  galleryLabel = 'Choose from gallery',
  cameraLabel = 'Take a photo',
  size = 'md',
  showCamera = true,
}: ImagePickerButtonsProps) {
  const height = size === 'sm' ? 'h-[var(--height-button-sm)]' : 'h-12';
  const text = size === 'sm' ? 'text-xs' : 'text-sm';
  const iconBox = size === 'sm' ? 'h-5 w-5' : 'h-7 w-7';
  const icon = size === 'sm' ? 'h-3 w-3' : 'h-[17px] w-[17px]';

  // Shared shell: each button fills its half of the row (or full width when
  // stacked on mobile), with a tinted icon chip that flips to a solid fill on
  // hover. Gallery leans coral, camera leans purple — same accent split the
  // rest of the picker UI uses.
  const base = `group flex w-full sm:flex-1 items-center justify-center gap-2.5 ${height} px-3 rounded-2xl border border-border bg-surface ${text} font-semibold text-text transition-all duration-200 press-effect`;
  const chip = `flex ${iconBox} items-center justify-center rounded-full transition-colors`;

  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full">
      <button
        type="button"
        onClick={() => {
          if (onGalleryClick) onGalleryClick();
          else fileInputRef?.current?.click();
        }}
        className={`${base} hover:border-coral hover:bg-coral/5 hover:text-coral`}
      >
        <span className={`${chip} bg-coral/10 text-coral group-hover:bg-coral group-hover:text-white`}>
          <ImagePlus className={icon} />
        </span>
        {galleryLabel}
      </button>
      {showCamera && (
        <label className={`${base} cursor-pointer hover:border-purple hover:bg-purple/5 hover:text-purple`}>
          <span className={`${chip} bg-purple/10 text-purple group-hover:bg-purple group-hover:text-white`}>
            <Camera className={icon} />
          </span>
          {cameraLabel}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onCameraSelect}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
