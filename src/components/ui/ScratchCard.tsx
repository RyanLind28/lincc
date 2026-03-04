import { useRef, useEffect, useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';

export interface ScratchCardProps {
  code: string;
  onRevealed?: () => void;
  /** Skip the scratch interaction and show the code directly */
  initialRevealed?: boolean;
}

export function ScratchCard({ code, onRevealed, initialRevealed = false }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const [revealed, setRevealed] = useState(initialRevealed);
  const [copied, setCopied] = useState(false);
  const revealedRef = useRef(initialRevealed);

  // Fire onRevealed immediately if initialRevealed
  useEffect(() => {
    if (initialRevealed) {
      onRevealed?.();
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkRevealThreshold = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || revealedRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;
    const total = pixels.length / 4;

    // Sample every 4th pixel for performance
    for (let i = 3; i < pixels.length; i += 16) {
      if (pixels[i] === 0) transparent++;
    }
    transparent *= 4;

    if (transparent / total > 0.3) {
      revealedRef.current = true;
      setRevealed(true);
      onRevealed?.();
    }
  }, [onRevealed]);

  useEffect(() => {
    if (initialRevealed) return; // No canvas needed

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw metallic gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#C0C0C0');
    gradient.addColorStop(0.3, '#E8E8E8');
    gradient.addColorStop(0.5, '#A0A0A0');
    gradient.addColorStop(0.7, '#D0D0D0');
    gradient.addColorStop(1, '#B0B0B0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle noise texture
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const brightness = Math.random() * 30 + 180;
      ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.3)`;
      ctx.fillRect(x, y, 1, 1);
    }

    // "Scratch to reveal" text
    ctx.fillStyle = '#888';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Scratch to reveal', canvas.width / 2, canvas.height / 2);
  }, [initialRevealed]);

  const getPos = (
    e: React.TouchEvent | React.MouseEvent
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      if (!touch) return null;
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (revealedRef.current) return;
    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getPos(e);
    if (pos) scratch(pos.x, pos.y);
  };

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawingRef.current || revealedRef.current) return;
    e.preventDefault();
    const pos = getPos(e);
    if (pos) {
      scratch(pos.x, pos.y);
      checkRevealThreshold();
    }
  };

  const handleEnd = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    checkRevealThreshold();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: do nothing
    }
  };

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative w-full h-24 rounded-xl overflow-hidden border-2 border-dashed border-coral select-none"
      >
        {/* Code text behind canvas */}
        <div className="absolute inset-0 flex items-center justify-center bg-surface">
          <span className="text-2xl font-mono font-bold text-coral tracking-widest">
            {code}
          </span>
        </div>

        {/* Scratch canvas overlay — only if not initially revealed */}
        {!initialRevealed && (
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
              revealed ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            style={{ touchAction: 'none' }}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
        )}
      </div>

      {/* Copy button after reveal */}
      {revealed && (
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-border
                     text-sm font-medium text-text hover:bg-gray-50 transition-colors animate-fade-in"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 text-text-muted" />
              Copy Code
            </>
          )}
        </button>
      )}
    </div>
  );
}
