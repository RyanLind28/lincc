import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Header } from '../components/layout';
import { Avatar, Button, Input, TextArea, ChipGroup } from '../components/ui';
import { Camera, Mail, Lock, ChevronRight } from 'lucide-react';
import { validateImageSize, compressImage } from '../lib/imageCompression';

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
  const [dob, setDob] = useState(profile?.dob || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [tags, setTags] = useState<string[]>(profile?.tags || []);

  // Security section state
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSecurityLoading, setIsSecurityLoading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const sizeError = validateImageSize(file);
    if (sizeError) {
      showToast(sizeError, 'error');
      return;
    }

    setIsLoading(true);

    try {
      const compressed = await compressImage(file);
      const filePath = `${user.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressed, { contentType: 'image/jpeg' });

      if (uploadError) {
        showToast('Failed to upload photo', 'error');
      } else {
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        setAvatarUrl(data.publicUrl);
      }
    } catch {
      showToast('Failed to process image', 'error');
    }

    setIsLoading(false);
  };

  const validateDob = (dobValue: string): boolean => {
    if (!dobValue) return true; // Optional to change
    const birthDate = new Date(dobValue);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      showToast('You must be 18 or older', 'error');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    if (!validateDob(dob)) return;

    if (!user?.id) return;

    setIsLoading(true);

    const updateData: Record<string, unknown> = {
      first_name: firstName.trim(),
      bio: bio.trim() || null,
      tags,
      avatar_url: avatarUrl || null,
    };

    if (dob) {
      updateData.dob = dob;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
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

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      showToast('Please enter a new email', 'error');
      return;
    }

    setIsSecurityLoading(true);

    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Confirmation email sent to your new address', 'success');
      setNewEmail('');
      setShowEmailChange(false);
    }

    setIsSecurityLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      showToast('Please enter a new password', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsSecurityLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Password updated successfully', 'success');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    }

    setIsSecurityLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
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

        {/* Date of Birth */}
        <Input
          label="Date of Birth"
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          helperText="You must be 18 or older"
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
            Interests
          </label>
          <ChipGroup
            options={INTEREST_TAGS}
            selected={tags}
            onChange={setTags}
          />
          <p className="text-xs text-text-muted mt-2">
            {tags.length} selected
          </p>
        </div>

        {/* Save button */}
        <Button onClick={handleSave} className="w-full" isLoading={isLoading}>
          Save Changes
        </Button>

        {/* Security Section */}
        <div className="pt-4 border-t border-border">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-4">
            Security
          </h2>

          {/* Update Email */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setShowEmailChange(!showEmailChange);
                setShowPasswordChange(false);
              }}
              className="w-full flex items-center gap-3 p-4 bg-surface rounded-xl border border-border hover:border-coral transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-coral/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-coral" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-text">Update Email</p>
                <p className="text-xs text-text-muted">{user?.email}</p>
              </div>
              <ChevronRight className={`h-5 w-5 text-text-light transition-transform ${showEmailChange ? 'rotate-90' : ''}`} />
            </button>

            {showEmailChange && (
              <div className="p-4 bg-surface rounded-xl border border-border space-y-3">
                <Input
                  label="New Email Address"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email"
                />
                <p className="text-xs text-text-muted">
                  A confirmation link will be sent to both your current and new email.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEmailChange(false);
                      setNewEmail('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateEmail}
                    isLoading={isSecurityLoading}
                    className="flex-1"
                  >
                    Update Email
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Update Password */}
          <div className="space-y-3 mt-3">
            <button
              type="button"
              onClick={() => {
                setShowPasswordChange(!showPasswordChange);
                setShowEmailChange(false);
              }}
              className="w-full flex items-center gap-3 p-4 bg-surface rounded-xl border border-border hover:border-coral transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-purple/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-purple" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-text">Update Password</p>
                <p className="text-xs text-text-muted">Change your password</p>
              </div>
              <ChevronRight className={`h-5 w-5 text-text-light transition-transform ${showPasswordChange ? 'rotate-90' : ''}`} />
            </button>

            {showPasswordChange && (
              <div className="p-4 bg-surface rounded-xl border border-border space-y-3">
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
                <p className="text-xs text-text-muted">
                  Password must be at least 6 characters.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdatePassword}
                    isLoading={isSecurityLoading}
                    className="flex-1"
                  >
                    Update Password
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
