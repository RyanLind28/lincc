import { Input } from '../../../components/ui';
import { CheckCircle, Loader2 } from 'lucide-react';

interface NameStepProps {
  firstName: string;
  lastName: string;
  profileName: string;
  usernameStatus: 'idle' | 'checking' | 'available' | 'taken';
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onProfileNameChange: (v: string) => void;
}

export function NameStep({
  firstName,
  lastName,
  profileName,
  usernameStatus,
  onFirstNameChange,
  onLastNameChange,
  onProfileNameChange,
}: NameStepProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold gradient-text mb-2">
        {firstName ? `Nice to meet you, ${firstName}` : 'What should we call you?'}
      </h1>
      <p className="text-text-muted mb-8">
        Your name and a username others will see.
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
      </div>
    </div>
  );
}
