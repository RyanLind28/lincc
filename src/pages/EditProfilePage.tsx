import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Header } from '../components/layout';
import { Avatar, Button, Input, TextArea, ChipGroup } from '../components/ui';
import { Camera } from 'lucide-react';

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

export default function EditProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [tags, setTags] = useState<string[]>(profile?.tags || []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 1024 * 1024) {
      showToast('Image must be less than 1MB', 'error');
      return;
    }

    setIsLoading(true);

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      showToast('Failed to upload photo', 'error');
    } else {
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
    }

    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    if (!user?.id) return;

    setIsLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim(),
        bio: bio.trim() || null,
        tags,
        avatar_url: avatarUrl || null,
      })
      .eq('id', user.id);

    if (error) {
      showToast('Failed to save profile', 'error');
    } else {
      await refreshProfile(user.id);
      showToast('Profile updated', 'success');
      navigate('/profile');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Edit Profile" showBack />

      <div className="p-4 space-y-6">
        {/* Photo */}
        <div className="flex justify-center">
          <label className="cursor-pointer">
            <div className="relative">
              <Avatar src={avatarUrl} name={firstName} size="xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md">
                <Camera className="h-4 w-4 text-white" />
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Name */}
        <Input
          label="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Your first name"
        />

        {/* Bio */}
        <TextArea
          label="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell others about yourself..."
          rows={3}
          maxLength={140}
          showCount
        />

        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Interests (max 3)
          </label>
          <ChipGroup
            options={INTEREST_TAGS}
            selected={tags}
            onChange={setTags}
            max={3}
          />
        </div>

        {/* Save button */}
        <Button onClick={handleSave} className="w-full" isLoading={isLoading}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
