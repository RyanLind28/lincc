import { TextArea } from '../../../components/ui';

interface BioStepProps {
  bio: string;
  onBioChange: (bio: string) => void;
}

export function BioStep({ bio, onBioChange }: BioStepProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold gradient-text mb-2">Write a bio</h1>
      <p className="text-text-muted mb-8">
        Share a bit about yourself. This is optional but helps others get to know you.
      </p>

      <TextArea
        value={bio}
        onChange={(e) => onBioChange(e.target.value)}
        placeholder="I'm always up for a coffee chat or a morning run..."
        rows={4}
        maxLength={140}
        showCount
      />
    </div>
  );
}
