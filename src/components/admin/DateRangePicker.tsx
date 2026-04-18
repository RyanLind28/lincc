import { cn } from '../../lib/utils';

interface DateRangePickerProps {
  value: number;
  onChange: (days: number) => void;
}

const RANGES = [
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex bg-background rounded-xl p-1 border border-border w-fit">
      {RANGES.map((r) => (
        <button
          key={r.days}
          onClick={() => onChange(r.days)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            value === r.days
              ? 'bg-surface text-text shadow-sm'
              : 'text-text-muted hover:text-text'
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
