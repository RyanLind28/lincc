import { logger } from '../lib/utils';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Header } from '../components/layout';
import { Avatar, Button, Input, TextArea, ChipGroup, AvatarCropper, ImagePickerButtons, UploadDebugPanel, CropperErrorBoundary } from '../components/ui';
import { Camera, Mail, Lock, ChevronRight, Loader2 } from 'lucide-react';
import { validateImageDetailed, convertHeicIfNeeded } from '../lib/imageCompression';
import { logUpload } from '../lib/uploadDebug';
import * as Sentry from '@sentry/react';

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
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [profileName, setProfileName] = useState(profile?.profile_name || '');
  const [dob, setDob] = useState(profile?.dob || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [tags, setTags] = useState<string[]>(profile?.tags || []);

  // Avatar cropper state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Security section state
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSecurityLoading, setIsSecurityLoading] = useState(false);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    logUpload('onChange:fired', `files=${e.target.files?.length ?? 0}`);
    const file = e.target.files?.[0];
    if (!file) {
      logUpload('onChange:no-file');
      return;
    }

    // Show feedback immediately — the read below is async and can take a moment
    // on a real device; without this the screen looks frozen ("nothing happens").
    setIsUploadingAvatar(true);

    // Validate (and read bytes into a JS-owned File) BEFORE clearing the
    // input — clearing `input.value` can revoke the picker's Content URI
    // permission on Samsung Android, breaking the read.
    let validation;
    try {
      validation = await validateImageDetailed(file);
    } catch (err) {
      // Defensive: validateImageDetailed shouldn't throw, but if it ever does
      // we must not leave the user staring at a frozen spinner with no error.
      logUpload('validate:threw', err instanceof Error ? err.message : String(err));
      Sentry.captureException(err, { tags: { feature: 'avatar', stage: 'validate-threw' } });
      showToast("Couldn't read that photo. Try another, or take one with your camera.", 'error');
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (!validation.ok) {
      logUpload('handler:validation-failed', validation.error);
      Sentry.captureMessage('avatar: validation rejected file', {
        level: 'info',
        extra: {
          reason: validation.error,
          fileType: file.type,
          fileSize: file.size,
          fileName: file.name,
          arrayBufferError: validation.arrayBufferError,
          recoveryAttempts: validation.recoveryAttempts,
        },
      });
      showToast(validation.error, 'error');
      setIsUploadingAvatar(false);
      return;
    }
    if (validation.recovered) {
      Sentry.captureMessage('avatar: recovered unreadable file', {
        level: 'info',
        extra: {
          fileType: file.type,
          fileSize: file.size,
          fileName: file.name,
          recoveredSize: validation.file.size,
          arrayBufferError: validation.arrayBufferError,
          recoveryAttempts: validation.recoveryAttempts,
        },
      });
    }

    // HEIC/HEIF won't decode in <img>/cropper in most browsers — convert first.
    let workingFile = validation.file;
    if (validation.format === 'heic') {
      setIsUploadingAvatar(true);
      try {
        workingFile = await convertHeicIfNeeded(workingFile, 'heic');
      } catch (err) {
        Sentry.captureException(err, {
          tags: { feature: 'avatar', stage: 'heic-convert' },
          extra: { fileType: workingFile.type, fileSize: workingFile.size, fileName: workingFile.name },
        });
        showToast(
          "Couldn't convert this iPhone photo. Try saving it as a JPEG and uploading again.",
          'error',
        );
        setIsUploadingAvatar(false);
        return;
      }
      setIsUploadingAvatar(false);
    }

    // Open the cropper. Revoke the previous source first — happens when the
    // user picked a new file via the cropper's "Choose different" button.
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    const objectUrl = URL.createObjectURL(workingFile);
    setCropSrc(objectUrl);
    setIsUploadingAvatar(false);
    logUpload('handler:cropper-open', `${workingFile.size}b`);
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    logUpload('crop:confirm', `${croppedBlob.size}b`);
    if (!user) return;
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setIsUploadingAvatar(true);

    try {
      const filePath = `${user.id}/${Date.now()}.jpg`;

      // Upload first; only delete the old avatar after the new one is committed
      // so a failed upload doesn't leave the user with no avatar.
      logUpload('upload:start', filePath);
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, { contentType: 'image/jpeg' });
      logUpload('upload:done', uploadError ? `ERR ${uploadError.message}` : 'ok');

      if (uploadError) {
        Sentry.captureException(uploadError, {
          tags: { feature: 'avatar', stage: 'upload' },
          extra: {
            filePath,
            blobSize: croppedBlob.size,
            userAgent: navigator.userAgent,
          },
        });
        if (uploadError.message?.includes('exceeded')) {
          showToast('File too large for the storage limits', 'error');
        } else if (uploadError.message?.toLowerCase().includes('not authorized')
          || uploadError.message?.toLowerCase().includes('permission')) {
          showToast('Permission denied. Please sign in again', 'error');
        } else {
          showToast(`Upload failed: ${uploadError.message}`, 'error');
        }
        return;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const newUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newUrl })
        .eq('id', user.id);

      if (updateError) {
        Sentry.captureException(updateError, {
          tags: { feature: 'avatar', stage: 'profile-update' },
          extra: { newUrl, userId: user.id },
        });
        showToast(`Saved photo, couldn't update profile: ${updateError.message}`, 'error');
        return;
      }

      // Now safe to clean up the old avatar files
      const { data: existingFiles } = await supabase.storage.from('avatars').list(user.id);
      if (existingFiles?.length) {
        const stale = existingFiles
          .map((f) => `${user.id}/${f.name}`)
          .filter((p) => p !== filePath);
        if (stale.length > 0) {
          await supabase.storage.from('avatars').remove(stale);
        }
      }

      setAvatarUrl(newUrl);
      await refreshProfile(user.id);
      logUpload('save:done', 'avatar updated');
      showToast('Photo updated', 'success');
    } catch (err) {
      logUpload('crop:threw', err instanceof Error ? err.message : String(err));
      Sentry.captureException(err, { tags: { feature: 'avatar', stage: 'flow' } });
      showToast(err instanceof Error ? err.message : 'Failed to update photo', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
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
      last_name: lastName.trim(),
      profile_name: profileName.trim() || `${firstName.trim()} ${lastName.trim()}`.trim() || 'User',
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
      logger.error('Profile update error:', error);
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
    <div className="min-h-screen bg-background pb-8 max-w-2xl mx-auto">
      <UploadDebugPanel />
      <Header title="Edit Profile" showBack />

      <div className="p-4 space-y-6">
        {/* Photo */}
        <div className="flex flex-col items-center gap-2">
          <label
            htmlFor="profile-avatar-input"
            aria-disabled={isUploadingAvatar}
            className={`relative ${isUploadingAvatar ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            aria-label={avatarUrl ? 'Replace profile photo' : 'Add profile photo'}
          >
            <Avatar src={avatarUrl} name={firstName} size="xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md">
              {isUploadingAvatar
                ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                : <Camera className="h-4 w-4 text-white" />}
            </div>
          </label>
          {/* sr-only keeps the input clickable on iOS Safari, where
              display:none breaks programmatic file-picker triggers. */}
          <input
            ref={fileInputRef}
            id="profile-avatar-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
            onChange={handlePhotoSelect}
            className="sr-only"
            disabled={isUploadingAvatar}
          />
          {/* Keep this mounted at all times: the camera input lives inside it,
              and unmounting it mid-read (e.g. when isUploadingAvatar flips true
              during HEIC conversion) revokes the captured photo's content:// URI
              on Android, so the selfie never loads. Mirrors onboarding PhotoStep. */}
          <ImagePickerButtons
            fileInputRef={fileInputRef}
            onCameraSelect={handlePhotoSelect}
            galleryLabel={avatarUrl ? 'Replace photo' : 'Choose photo'}
            cameraLabel="Selfie"
            capture="user"
            size="sm"
          />
        </div>

        {cropSrc && (
          <CropperErrorBoundary>
            <AvatarCropper
              src={cropSrc}
              isOpen
              onClose={handleCropCancel}
              onConfirm={handleCropConfirm}
              cropShape="round"
              aspect={1}
              pickerInputId="profile-avatar-input"
            />
          </CropperErrorBoundary>
        )}

        {/* Name */}
        <Input
          label="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Your first name"
        />

        <Input
          label="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Your last name"
        />

        <Input
          label="Profile Name"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          placeholder="How your name appears to others"
          helperText="This is the name shown on your profile"
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
