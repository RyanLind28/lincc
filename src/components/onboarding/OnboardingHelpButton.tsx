import { LifeBuoy } from 'lucide-react';
import { useReportProblem } from '../../contexts/ReportProblemContext';

interface OnboardingHelpButtonProps {
  /** Tag for the report record so admins can see which screen the user was on. */
  source: string;
  className?: string;
}

// Compact pill used in onboarding screens to surface the report-a-problem sheet
// without disturbing the centered layout. Positioning is left to the caller
// (typically absolute top-right via the className prop).
export function OnboardingHelpButton({ source, className = '' }: OnboardingHelpButtonProps) {
  const { openReport } = useReportProblem();
  return (
    <button
      type="button"
      onClick={() => openReport({ source })}
      aria-label="Report a problem"
      className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-surface/80 backdrop-blur border border-border text-xs font-medium text-text-muted hover:text-coral hover:border-coral/50 transition-colors ${className}`}
    >
      <LifeBuoy className="h-3.5 w-3.5" />
      Need help?
    </button>
  );
}
