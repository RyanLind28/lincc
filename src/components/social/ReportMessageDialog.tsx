import { useState } from 'react';
import { BottomSheet, Button, TextArea } from '../ui';
import { CHAT_REPORT_REASONS, submitReport } from '../../services/reportService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface ReportMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Author of the offending message — they are the "reported user" */
  reportedUserId: string;
  reportedUserName: string;
  /** Snippet shown in the dialog so the reporter sees what they're reporting */
  messagePreview: string;
  /** Either of these two should be set, depending on chat kind */
  messageId?: string;
  dmMessageId?: string;
  /** Event chat reports include event_id for admin context */
  eventId?: string;
}

export function ReportMessageDialog({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
  messagePreview,
  messageId,
  dmMessageId,
  eventId,
}: ReportMessageDialogProps) {
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
      messageId,
      dmMessageId,
      reason: selectedReason,
      details: details.trim() || undefined,
    });
    setIsSubmitting(false);
    if (result.success) {
      showToast("Report submitted. We'll review it shortly.", 'success');
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
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={`Report message from ${reportedUserName}`}>
      <div className="space-y-4 pb-4">
        <div className="bg-background border border-border rounded-xl p-3">
          <p className="text-xs text-text-muted mb-1">Message</p>
          <p className="text-sm text-text whitespace-pre-wrap break-words line-clamp-5">{messagePreview}</p>
        </div>

        <p className="text-sm text-text-muted">
          What's the issue? Our team reviews chat reports within 24 hours.
        </p>

        <div className="space-y-2">
          {CHAT_REPORT_REASONS.map((reason) => (
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
            placeholder="Any context that helps the moderator…"
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
            Submit report
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
