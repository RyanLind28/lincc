import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { subscribeUploadLog, clearUploadLog, type UploadLogLine } from '../../lib/uploadDebug';

/**
 * Visible on-device trace of the image upload pipeline. Renders nothing until
 * the first step is logged, then shows a fixed panel listing each step with a
 * relative timestamp. Lets a tester's screen recording pinpoint exactly where
 * a photo pick dies. Pre-launch debugging aid.
 */
export function UploadDebugPanel() {
  const [lines, setLines] = useState<UploadLogLine[]>([]);

  useEffect(() => subscribeUploadLog(setLines), []);

  if (lines.length === 0) return null;

  const start = lines[0].t;

  return (
    <div className="fixed bottom-2 left-2 right-2 z-[2147483647] max-h-[40vh] overflow-auto rounded-xl border border-coral/40 bg-black/90 p-2 text-left font-mono text-[10px] leading-snug text-green-300 shadow-2xl safe-bottom">
      <div className="flex items-center justify-between mb-1 sticky top-0">
        <span className="font-bold text-coral">upload debug</span>
        <button
          type="button"
          onClick={clearUploadLog}
          className="text-white/70 hover:text-white"
          aria-label="Clear upload debug log"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {lines.map((l, i) => (
        <div key={i} className="whitespace-pre-wrap break-all">
          <span className="text-white/50">+{l.t - start}ms </span>
          <span className="text-coral">{l.step}</span>
          {l.detail ? <span className="text-green-200">: {l.detail}</span> : null}
        </div>
      ))}
    </div>
  );
}
