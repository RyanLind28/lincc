import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Bug, LifeBuoy, MessageSquare } from 'lucide-react';
import { BottomSheet, GradientButton, TextArea } from '../components/ui';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { submitFeedback } from '../services/feedbackService';
import { buildReportContext } from '../lib/reportContext';

interface OpenReportOptions {
  /** Tag for where the report came from, e.g. 'event-cover'. Stored in context. */
  source?: string;
}

interface ReportProblemContextValue {
  openReport: (opts?: OpenReportOptions) => void;
}

// Safe no-op default so `useReportProblem()` never throws even if a component
// renders outside the provider (the provider is mounted globally in App).
const ReportProblemContext = createContext<ReportProblemContextValue>({ openReport: () => {} });

export function useReportProblem() {
  return useContext(ReportProblemContext);
}

const CATEGORIES = [
  { value: 'bug', label: 'Something broke', icon: Bug },
  { value: 'support', label: "I'm stuck", icon: LifeBuoy },
  { value: 'feedback', label: 'Other', icon: MessageSquare },
];

export function ReportProblemProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [type, setType] = useState('bug');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openReport = useCallback((opts?: OpenReportOptions) => {
    setSource(opts?.source ?? null);
    setType('bug');
    setBody('');
    setIsOpen(true);
  }, []);

  const close = () => {
    if (!isSubmitting) setIsOpen(false);
  };

  const handleSubmit = async () => {
    if (!body.trim()) return;
    if (!user?.id) {
      showToast('Please log in to send a report', 'error');
      return;
    }
    setIsSubmitting(true);
    const context = buildReportContext({ source });
    const subject = source ? `Problem report: ${source}` : 'Problem report';
    const { success } = await submitFeedback({
      userId: user.id,
      type,
      subject,
      body: body.trim(),
      context,
    });
    setIsSubmitting(false);
    if (success) {
      showToast("Thanks, we're on it.", 'success');
      setIsOpen(false);
      setBody('');
    } else {
      showToast("Couldn't send your report. Please try again.", 'error');
    }
  };

  return (
    <ReportProblemContext.Provider value={{ openReport }}>
      {children}
      <BottomSheet isOpen={isOpen} onClose={close} title="Report a problem">
        <div className="space-y-4 pb-2">
          <p className="text-sm text-text-muted">
            Tell us what happened. We'll attach your screen and device details automatically so we can fix it faster.
          </p>

          <div className="rounded-xl bg-coral/5 border border-coral/20 p-3 text-sm text-text">
            We're sorry for the trouble. We aim to get back to you within 24 hours of your report.
          </div>

          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const selected = type === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setType(c.value)}
                  className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-colors ${
                    selected
                      ? 'gradient-primary text-white border-transparent'
                      : 'bg-surface text-text border-border hover:border-coral'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {c.label}
                </button>
              );
            })}
          </div>

          <TextArea
            label="What went wrong?"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What were you trying to do, and what happened?"
            rows={4}
          />

          <GradientButton onClick={handleSubmit} fullWidth isLoading={isSubmitting} disabled={!body.trim()}>
            Send report
          </GradientButton>
        </div>
      </BottomSheet>
    </ReportProblemContext.Provider>
  );
}
