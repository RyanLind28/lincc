import { useState, useEffect } from 'react';
import { X, Megaphone, AlertTriangle, Wrench } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: string;
}

const DISMISSED_KEY = 'lincc-dismissed-announcements';

const typeConfig = {
  info: {
    icon: Megaphone,
    gradient: 'from-coral to-purple',
  },
  warning: {
    icon: AlertTriangle,
    gradient: 'from-warning to-warning-dark',
  },
  maintenance: {
    icon: Wrench,
    gradient: 'from-error to-error-dark',
  },
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
    <div className="mx-4 mt-3 animate-slide-up-sm">
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${config.gradient} p-4 shadow-md`}>
        {/* Decorative circles */}
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />

        <div className="relative flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{announcement.title}</p>
            <p className="text-xs text-white/80 mt-0.5 leading-relaxed">{announcement.body}</p>
          </div>
          <button
            onClick={dismiss}
            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
