import { AlertCircle } from 'lucide-react';
import { useReportProblem } from '../../contexts/ReportProblemContext';

interface UploadErrorNoticeProps {
  /** Short, user-facing reason the upload failed. */
  message: string;
  /** Retry the pick/upload — usually re-opens the picker or re-runs submit. */
  onRetry: () => void;
  /** Carry on without the image. The image is always optional where this shows. */
  onSkip: () => void;
  retryLabel?: string;
  skipLabel?: string;
  /** When set, shows a "Report a problem" link that opens the reporter tagged with this source. */
  reportSource?: string;
}

/**
 * Compact inline failure notice for image uploads. Deliberately small — image
 * upload is never required to finish a flow, so a broken pick should offer a
 * one-tap "Try again" or "Skip" and get out of the way, not a full-screen
 * recovery wall. When `reportSource` is set it also offers a one-tap problem
 * report with device/screen context attached automatically.
 */
export function UploadErrorNotice({
  message,
  onRetry,
  onSkip,
  retryLabel = 'Try again',
  skipLabel = 'Skip',
  reportSource,
}: UploadErrorNoticeProps) {
  const { openReport } = useReportProblem();
  return (
    <div className="w-full text-left bg-error/5 border border-error/20 rounded-xl p-3 flex items-start gap-2.5">
      <AlertCircle className="h-4 w-4 text-error mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-text-muted leading-relaxed mb-2">{message}</p>
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={onRetry}
            className="text-xs font-semibold text-coral hover:text-coral-dark"
          >
            {retryLabel}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-semibold text-text-muted hover:text-text"
          >
            {skipLabel}
          </button>
          {reportSource && (
            <button
              type="button"
              onClick={() => openReport({ source: reportSource })}
              className="text-xs font-semibold text-text-muted hover:text-text"
            >
              Report a problem
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
