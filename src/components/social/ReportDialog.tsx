import { useState } from 'react';
import { BottomSheet, Button, TextArea } from '../ui';
import { REPORT_REASONS, submitReport } from '../../services/reportService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
  eventId?: string;
}

export function ReportDialog({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
  eventId,
}: ReportDialogProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !selectedReason) return;

    setIsSubmitting(true);
    const result = await submitReport({
      reporterId: user.id,
      reportedUserId,
      eventId,
      reason: selectedReason,
      details: details.trim() || undefined,
    });
    setIsSubmitting(false);

    if (result.success) {
      showToast('Report submitted. We\'ll review it shortly.', 'success');
      handleClose();
    } else {
      showToast('Failed to submit report', 'error');
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setDetails('');
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={`Report ${reportedUserName}`}>
      <div className="space-y-4 pb-4">
        <p className="text-sm text-text-muted">
          Select a reason for your report. Our team will review it within 24 hours.
        </p>

        <div className="space-y-2">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason.value}
              type="button"
              onClick={() => setSelectedReason(reason.value)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                selectedReason === reason.value
                  ? 'bg-coral/10 border-coral text-coral'
                  : 'bg-surface border-border text-text hover:border-coral/50'
              }`}
            >
              {reason.label}
            </button>
          ))}
        </div>

        {selectedReason && (
          <TextArea
            label="Additional details (optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Provide more context if needed..."
            rows={3}
            maxLength={500}
          />
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!selectedReason}
            className="flex-1"
          >
            Submit Report
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
