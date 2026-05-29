import type { Gender } from '../../../types';

const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
];

interface BirthdayStepProps {
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  gender: Gender | '';
  onDobDayChange: (v: string) => void;
  onDobMonthChange: (v: string) => void;
  onDobYearChange: (v: string) => void;
  onGenderChange: (v: Gender) => void;
}

export function BirthdayStep({
  dobDay,
  dobMonth,
  dobYear,
  gender,
  onDobDayChange,
  onDobMonthChange,
  onDobYearChange,
  onGenderChange,
}: BirthdayStepProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold gradient-text mb-2">A few more details</h1>
      <p className="text-text-muted mb-8">
        Your date of birth and gender help us keep Lincc safe and relevant.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Date of Birth
          </label>
          <div className="flex gap-2">
            <select
              value={dobDay}
              onChange={(e) => onDobDayChange(e.target.value)}
              className="flex-1 h-[var(--height-input)] px-3 bg-background border border-border rounded-xl text-text text-sm appearance-none"
            >
              <option value="">Day</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={String(d).padStart(2, '0')}>{d}</option>
              ))}
            </select>
            <select
              value={dobMonth}
              onChange={(e) => onDobMonthChange(e.target.value)}
              className="flex-[1.4] h-[var(--height-input)] px-3 bg-background border border-border rounded-xl text-text text-sm appearance-none"
            >
              <option value="">Month</option>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
              ))}
            </select>
            <select
              value={dobYear}
              onChange={(e) => onDobYearChange(e.target.value)}
              className="flex-1 h-[var(--height-input)] px-3 bg-background border border-border rounded-xl text-text text-sm appearance-none"
            >
              <option value="">Year</option>
              {Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 18 - i).map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-text-muted mt-1.5">You must be 18 or older</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Gender
          </label>
          <div className="flex gap-2">
            {GENDER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onGenderChange(option.value as Gender)}
                className={`flex-1 h-[var(--height-tap-target)] px-4 rounded-xl border text-sm font-medium transition-colors press-effect ${
                  gender === option.value
                    ? 'gradient-primary text-white border-transparent'
                    : 'bg-surface text-text border-border hover:border-coral'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
