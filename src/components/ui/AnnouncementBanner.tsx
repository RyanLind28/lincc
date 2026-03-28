import { useState, useEffect } from 'react';
import { X, Info, AlertTriangle, Wrench } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: string;
}

const DISMISSED_KEY = 'lincc-dismissed-announcements';

const typeConfig = {
  info: { icon: Info, bg: 'bg-blue/10 border-blue/20', text: 'text-blue' },
  warning: { icon: AlertTriangle, bg: 'bg-warning/10 border-warning/20', text: 'text-warning' },
  maintenance: { icon: Wrench, bg: 'bg-error/10 border-error/20', text: 'text-error' },
} as const;

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    const dismissed: string[] = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
    supabase
      .from('announcements')
      .select('id, title, body, type')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        const latest = data?.[0];
        if (latest && !dismissed.includes(latest.id)) {
          setAnnouncement(latest);
        }
      });
  }, []);

  if (!announcement) return null;

  const config = typeConfig[announcement.type as keyof typeof typeConfig] || typeConfig.info;
  const Icon = config.icon;

  const dismiss = () => {
    const dismissed: string[] = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
    dismissed.push(announcement.id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    setAnnouncement(null);
  };

  return (
    <div className={`mx-4 mt-2 p-3 rounded-xl border ${config.bg} flex items-start gap-2.5 animate-fade-in`}>
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.text}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${config.text}`}>{announcement.title}</p>
        <p className="text-xs text-text-muted mt-0.5">{announcement.body}</p>
      </div>
      <button onClick={dismiss} className="p-0.5 text-text-light hover:text-text flex-shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
