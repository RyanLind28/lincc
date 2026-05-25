import { Input } from '../../../components/ui';
import { CheckCircle, Loader2 } from 'lucide-react';
import type { Gender } from '../../../types';

const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
];

interface BasicInfoStepProps {
  firstName: string;
  lastName: string;
  profileName: string;
  usernameStatus: 'idle' | 'checking' | 'available' | 'taken';
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  gender: Gender | '';
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onProfileNameChange: (v: string) => void;
  onDobDayChange: (v: string) => void;
  onDobMonthChange: (v: string) => void;
  onDobYearChange: (v: string) => void;
  onGenderChange: (v: Gender) => void;
}

export function BasicInfoStep({
  firstName,
  lastName,
  profileName,
  usernameStatus,
  dobDay,
  dobMonth,
  dobYear,
  gender,
  onFirstNameChange,
  onLastNameChange,
  onProfileNameChange,
  onDobDayChange,
  onDobMonthChange,
  onDobYearChange,
  onGenderChange,
}: BasicInfoStepProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold gradient-text mb-2">
        {firstName ? `Tell us about you, ${firstName}` : 'Tell us about you'}
      </h1>
      <p className="text-text-muted mb-8">
        Pick a username and the basics.
      </p>

      <div className="space-y-4">
        {(!firstName.trim() || !lastName.trim()) && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              placeholder="Your first name"
              autoComplete="given-name"
            />
            <Input
              label="Last name"
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              placeholder="Your last name"
              autoComplete="family-name"
            />
          </div>
        )}

        <div>
          <Input
            label="Username"
            value={profileName}
            onChange={(e) => onProfileNameChange(e.target.value)}
            placeholder="How others see you on Lincc"
          />
          {profileName.trim() && usernameStatus === 'checking' && (
            <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Checking availability…
            </p>
          )}
          {profileName.trim() && usernameStatus === 'available' && (
            <p className="text-xs text-success mt-1.5 flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3" />
              Available
            </p>
          )}
          {profileName.trim() && usernameStatus === 'taken' && (
            <p className="text-xs text-error mt-1.5">
              That username is taken, try another.
            </p>
          )}
          {!profileName.trim() && (
            <p className="text-xs text-text-muted mt-1.5">This is the name other people see. Defaults to your full name.</p>
          )}
        </div>

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
