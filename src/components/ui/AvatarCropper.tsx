import { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Modal, GradientButton, Button } from './';
import { cropImageToBlob } from '../../lib/imageCompression';

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
}

export function AvatarCropper({
  src,
  isOpen,
  onClose,
  onConfirm,
  aspect = 1,
  cropShape = 'round',
  title = 'Crop your photo',
}: AvatarCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
        <div className="relative w-full aspect-square bg-background rounded-2xl overflow-hidden border border-border">
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
          <GradientButton onClick={handleConfirm} isLoading={isProcessing} fullWidth>
            Use photo
          </GradientButton>
        </div>
      </div>
    </Modal>
  );
}
