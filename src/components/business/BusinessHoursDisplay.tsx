import { Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { BusinessOpeningHours } from '../../types';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

function getTodayKey(): string {
  const dayIndex = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const map = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return map[dayIndex];
}

interface Props {
  hours: BusinessOpeningHours;
  compact?: boolean;
}

export function BusinessHoursDisplay({ hours, compact = false }: Props) {
  const today = getTodayKey();

  if (compact) {
    const todayHours = hours[today as keyof BusinessOpeningHours];
    return (
      <div className="flex items-center gap-1.5 text-sm">
        <Clock className="h-3.5 w-3.5 text-text-muted" />
        {todayHours ? (
          <span className="text-green-500 font-medium">
            Open today {todayHours.open} – {todayHours.close}
          </span>
        ) : (
          <span className="text-text-muted">Closed today</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-text-muted" />
        <span className="text-sm font-medium text-text">Opening Hours</span>
      </div>
      {DAYS.map((day) => {
        const dayHours = hours[day];
        const isToday = day === today;
        return (
          <div
            key={day}
            className={cn(
              'flex items-center justify-between text-sm px-2 py-1 rounded-lg',
              isToday && 'bg-coral/5 font-medium'
            )}
          >
            <span className={cn('w-10', isToday ? 'text-coral' : 'text-text-muted')}>
              {DAY_LABELS[day]}
            </span>
            {dayHours ? (
              <span className={isToday ? 'text-coral' : 'text-text'}>
                {dayHours.open} – {dayHours.close}
              </span>
            ) : (
              <span className="text-text-light">Closed</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
