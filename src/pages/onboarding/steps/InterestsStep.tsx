import { ChipGroup } from '../../../components/ui';

const INTEREST_TAGS = [
  { value: 'coffee', label: 'Coffee', icon: '☕' },
  { value: 'food', label: 'Food & Drinks', icon: '🍽️' },
  { value: 'sports', label: 'Sports', icon: '⚽' },
  { value: 'fitness', label: 'Fitness', icon: '💪' },
  { value: 'walking', label: 'Walking', icon: '🚶' },
  { value: 'hiking', label: 'Hiking', icon: '🥾' },
  { value: 'running', label: 'Running', icon: '🏃' },
  { value: 'cycling', label: 'Cycling', icon: '🚴' },
  { value: 'gaming', label: 'Gaming', icon: '🎮' },
  { value: 'movies', label: 'Movies', icon: '🎬' },
  { value: 'music', label: 'Music', icon: '🎵' },
  { value: 'art', label: 'Art & Culture', icon: '🎨' },
  { value: 'study', label: 'Study & Work', icon: '📚' },
  { value: 'language', label: 'Language Exchange', icon: '🗣️' },
  { value: 'boardgames', label: 'Board Games', icon: '🎲' },
  { value: 'yoga', label: 'Yoga & Wellness', icon: '🧘' },
  { value: 'pets', label: 'Pets', icon: '🐕' },
  { value: 'photography', label: 'Photography', icon: '📷' },
];

interface InterestsStepProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function InterestsStep({ tags, onTagsChange }: InterestsStepProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold gradient-text mb-2">Your interests</h1>
      <p className="text-text-muted mb-8">
        Select the activities you enjoy. This helps others find you.
      </p>

      <ChipGroup
        options={INTEREST_TAGS}
        selected={tags}
        onChange={onTagsChange}
      />

      <p className="text-sm text-text-muted mt-4">
        {tags.length} selected
      </p>
    </div>
  );
}
