import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout';
import { GradientButton, Input, TextArea } from '../components/ui';
import { MessageSquare, Bug, Lightbulb, HeadphonesIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const TYPES = [
  { value: 'feedback', label: 'Feedback', icon: MessageSquare },
  { value: 'feature_request', label: 'Feature Request', icon: Lightbulb },
  { value: 'bug', label: 'Bug Report', icon: Bug },
  { value: 'support', label: 'Support', icon: HeadphonesIcon },
];

export default function FeedbackPage() {
  const [type, setType] = useState('feedback');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!subject.trim() || !body.trim() || !user?.id) return;
    setIsSubmitting(true);

    const { error } = await supabase
      .from('feedback')
      .insert({ user_id: user.id, type, subject: subject.trim(), body: body.trim() });

    if (error) {
      showToast('Failed to submit. Please try again.', 'error');
    } else {
      showToast('Thanks for your feedback!', 'success');
      navigate(-1);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Send Feedback" showBack />

      <div className="p-4 space-y-5">
        {/* Type selector */}
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => {
            const Icon = t.icon;
            const selected = type === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-colors ${
                  selected
                    ? 'gradient-primary text-white border-transparent'
                    : 'bg-surface text-text border-border hover:border-coral'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        <Input
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief summary"
        />

        <TextArea
          label="Details"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Tell us more..."
          rows={5}
        />

        <GradientButton
          onClick={handleSubmit}
          fullWidth
          isLoading={isSubmitting}
          disabled={!subject.trim() || !body.trim()}
        >
          Submit
        </GradientButton>
      </div>
    </div>
  );
}
