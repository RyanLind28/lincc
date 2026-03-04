import { useRef, useState, useCallback } from 'react';
import { ChevronRight, Check, Loader2 } from 'lucide-react';

export interface SwipeToRedeemProps {
  onConfirm: () => Promise<void> | void;
  label?: string;
  confirmedLabel?: string;
}

export function SwipeToRedeem({
  onConfirm,
  label = 'Swipe to confirm redemption',
  confirmedLabel = 'Redeemed!',
}: SwipeToRedeemProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const startXRef = useRef(0);
  const thumbWidth = 56;

  const getMaxOffset = useCallback(() => {
    if (!trackRef.current) return 200;
    return trackRef.current.offsetWidth - thumbWidth - 8; // 8 for padding
  }, []);

  const handleStart = (clientX: number) => {
    if (confirmed || isLoading) return;
    setIsDragging(true);
    startXRef.current = clientX - offsetX;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || confirmed || isLoading) return;
    const maxOffset = getMaxOffset();
    const newOffset = Math.min(Math.max(0, clientX - startXRef.current), maxOffset);
    setOffsetX(newOffset);
  };

  const handleEnd = async () => {
    if (!isDragging || confirmed || isLoading) return;
    setIsDragging(false);

    const maxOffset = getMaxOffset();
    // Need to swipe past 85% to confirm
    if (offsetX >= maxOffset * 0.85) {
      setOffsetX(maxOffset);
      setIsLoading(true);
      try {
        await onConfirm();
        setConfirmed(true);
      } catch {
        // Reset on failure
        setOffsetX(0);
      }
      setIsLoading(false);
    } else {
      // Snap back
      setOffsetX(0);
    }
  };

  const progress = trackRef.current
    ? offsetX / (trackRef.current.offsetWidth - thumbWidth - 8)
    : 0;

  return (
    <div
      ref={trackRef}
      className={`relative h-14 rounded-xl overflow-hidden select-none ${
        confirmed ? 'bg-green-500' : 'bg-gray-100'
      } transition-colors duration-300`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Background fill as user swipes */}
      {!confirmed && (
        <div
          className="absolute inset-y-0 left-0 gradient-primary rounded-xl transition-none"
          style={{ width: offsetX + thumbWidth + 4, opacity: 0.15 + progress * 0.4 }}
        />
      )}

      {/* Label text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className={`text-sm font-semibold transition-opacity ${
            confirmed ? 'text-white' : 'text-text-muted'
          }`}
          style={{ opacity: confirmed ? 1 : Math.max(0, 1 - progress * 2) }}
        >
          {confirmed ? confirmedLabel : label}
        </span>
      </div>

      {/* Draggable thumb */}
      {!confirmed && (
        <div
          className="absolute top-1 left-1 h-12 w-12 rounded-lg gradient-primary
                     flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing
                     transition-transform"
          style={{
            transform: `translateX(${offsetX}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease',
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            handleStart(e.clientX);
          }}
          onTouchStart={(e) => handleStart(e.touches[0].clientX)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX)}
          onTouchEnd={handleEnd}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          ) : (
            <ChevronRight className="h-5 w-5 text-white" />
          )}
        </div>
      )}

      {/* Confirmed checkmark */}
      {confirmed && (
        <div className="absolute top-1 right-1 h-12 w-12 rounded-lg bg-white/20
                        flex items-center justify-center animate-fade-in">
          <Check className="h-6 w-6 text-white" strokeWidth={3} />
        </div>
      )}

      {/* Mouse move/up listeners on window when dragging */}
      {isDragging && (
        <div
          className="fixed inset-0 z-50"
          onMouseMove={(e) => handleMove(e.clientX)}
          onMouseUp={handleEnd}
        />
      )}
    </div>
  );
}
