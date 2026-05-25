import { Camera, ImagePlus } from 'lucide-react';
import type { RefObject } from 'react';

interface ImagePickerButtonsProps {
  fileInputRef?: RefObject<HTMLInputElement | null>;
  onGalleryClick?: () => void;
  onCameraSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  galleryLabel?: string;
  cameraLabel?: string;
  size?: 'sm' | 'md';
}

export function ImagePickerButtons({
  fileInputRef,
  onGalleryClick,
  onCameraSelect,
  galleryLabel = 'Choose from gallery',
  cameraLabel = 'Take a photo',
  size = 'md',
}: ImagePickerButtonsProps) {
  const height = size === 'sm' ? 'h-[var(--height-button-sm)]' : 'h-[var(--height-tap-target)]';
  const text = size === 'sm' ? 'text-xs' : 'text-sm';
  const px = size === 'sm' ? 'px-3' : 'px-5';

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2">
      <button
        type="button"
        onClick={() => {
          if (onGalleryClick) onGalleryClick();
          else fileInputRef?.current?.click();
        }}
        className={`inline-flex items-center gap-2 ${height} ${px} rounded-xl border border-border bg-surface text-text ${text} font-medium hover:border-coral hover:text-coral transition-colors press-effect`}
      >
        <ImagePlus className="h-4 w-4" />
        {galleryLabel}
      </button>
      <label className={`inline-flex items-center gap-2 ${height} ${px} rounded-xl border border-border bg-surface text-text ${text} font-medium hover:border-purple hover:text-purple transition-colors cursor-pointer press-effect`}>
        <Camera className="h-4 w-4" />
        {cameraLabel}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onCameraSelect}
          className="hidden"
        />
      </label>
    </div>
  );
}
