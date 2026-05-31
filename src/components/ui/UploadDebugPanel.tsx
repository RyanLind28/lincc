import { useEffect, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { subscribeUploadLog, clearUploadLog, APP_VERSION, type UploadLogLine } from '../../lib/uploadDebug';

/**
 * Visible on-device trace of the image upload pipeline. Always rendered (shows
 * the build version even before any pick) so a tester can confirm which build
 * they're on, then read exactly where a photo pick dies. A Copy button dumps
 * the whole trace as plain text so testers can paste it instead of screenshot.
 * Pre-launch debugging aid.
 */
export function UploadDebugPanel() {
  const [lines, setLines] = useState<UploadLogLine[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => subscribeUploadLog(setLines), []);

  const start = lines.length ? lines[0].t : 0;

  const asText = () =>
    `upload debug — BUILD v${APP_VERSION}\n` +
    (lines.length === 0
      ? '(no events yet)'
      : lines.map((l) => `+${l.t - start}ms ${l.step}${l.detail ? ': ' + l.detail : ''}`).join('\n'));

  const handleCopy = async () => {
    const text = asText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        return;
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed bottom-2 left-2 right-2 z-[2147483647] max-h-[40vh] overflow-auto rounded-xl border border-coral/40 bg-black/90 p-2 text-left font-mono text-[10px] leading-snug text-green-300 shadow-2xl safe-bottom">
      <div className="flex items-center justify-between gap-2 mb-1 sticky top-0">
        <span className="font-bold text-coral">upload debug — BUILD v{APP_VERSION}</span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md border border-white/30 px-2 py-1 text-white/90 hover:bg-white/10 active:bg-white/20"
            aria-label="Copy upload debug log"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            onClick={clearUploadLog}
            className="rounded-md p-1 text-white/70 hover:text-white hover:bg-white/10"
            aria-label="Clear upload debug log"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {lines.length === 0 ? (
        <div className="text-white/50">waiting for a photo pick…</div>
      ) : (
        lines.map((l, i) => (
          <div key={i} className="whitespace-pre-wrap break-all">
            <span className="text-white/50">+{l.t - start}ms </span>
            <span className="text-coral">{l.step}</span>
            {l.detail ? <span className="text-green-200">: {l.detail}</span> : null}
          </div>
        ))
      )}
    </div>
  );
}
