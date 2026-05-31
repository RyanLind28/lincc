import { useState, useCallback, useEffect } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Modal, GradientButton, Button } from './';
import { cropImageToBlob } from '../../lib/imageCompression';
import { logUpload } from '../../lib/uploadDebug';

interface AvatarCropperProps {
  /** Object URL of the source image */
  src: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (blob: Blob) => void;
  /** Output crop aspect ratio. 1 = square (avatar default). */
  aspect?: number;
  /** "circle" shows a circular crop frame, "square" shows a square one. */
  cropShape?: 'round' | 'rect';
  title?: string;
  /** When set, renders a "Choose different photo" button that re-opens the
   *  parent's file input via <label htmlFor>. Pass the parent input's `id`. */
  pickerInputId?: string;
}

export function AvatarCropper({
  src,
  isOpen,
  onClose,
  onConfirm,
  aspect = 1,
  cropShape = 'round',
  title = 'Crop your photo',
  pickerInputId,
}: AvatarCropperProps) {
  // Render-phase trace: proves the component function is actually invoked. If
  // the upload trace shows 'cropper-open' but never 'cropper:render', the
  // component is never even called (a conditional-render/state issue upstream).
  logUpload('cropper:render', `open=${isOpen} src=${src ? 'set' : 'null'}`);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset crop position/zoom when the user picks a different photo, otherwise
  // react-easy-crop keeps the previous coordinates against the new image.
  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setPixels(null);
  }, [src]);

  // Debug: confirm the cropper modal actually mounted on-device. If the upload
  // trace shows 'handler:cropper-open' but never 'cropper:mounted', the Modal
  // isn't rendering. Pre-launch aid.
  useEffect(() => {
    if (isOpen) logUpload('cropper:mounted');
  }, [isOpen]);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!pixels) return;
    setIsProcessing(true);
    try {
      const blob = await cropImageToBlob(src, pixels);
      onConfirm(blob);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md" closeOnOverlayClick={false}>
      <div className="space-y-4">
        {/* min-h is critical: react-easy-crop measures this container to size
            the crop area. An aspect-ratio-only box inside the modal's slide-up
            transform can measure as 0 height on mobile, leaving the cropper
            invisible ("nothing happens"). A fixed min-height guarantees a
            non-zero box to measure. */}
        <div className="relative w-full aspect-square min-h-[280px] bg-background rounded-2xl overflow-hidden border border-border">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onMediaLoaded={(mediaSize) =>
              logUpload('cropper:media-loaded', `${mediaSize.naturalWidth}x${mediaSize.naturalHeight}`)
            }
            mediaProps={{
              onError: () => logUpload('cropper:media-error', 'img failed to load'),
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full accent-coral"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          {pickerInputId && (
            <label
              htmlFor={pickerInputId}
              className="flex-1 inline-flex items-center justify-center h-11 px-3 rounded-xl border border-border text-sm font-medium text-text hover:border-coral hover:text-coral cursor-pointer transition-colors"
            >
              Choose different
            </label>
          )}
          <GradientButton onClick={handleConfirm} isLoading={isProcessing} fullWidth>
            Use photo
          </GradientButton>
        </div>
      </div>
    </Modal>
  );
}
