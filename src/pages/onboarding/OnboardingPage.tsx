import { logger } from '../../lib/utils';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { GradientButton, Input, TextArea, Avatar, ChipGroup, AvatarCropper } from '../../components/ui';
import { Camera, ArrowLeft, ArrowRight, Download, Bell, ChevronRight, MapPin, CheckCircle } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import { detectInstallPlatform, getInstallInstructions, InstallSteps } from '../../components/pwa/installInstructions';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useLocationName } from '../../hooks/useLocationName';
import { validateImageDetailed, convertHeicIfNeeded } from '../../lib/imageCompression';
import * as Sentry from '@sentry/react';
import type { Gender, Coordinates } from '../../types';

const LOCATION_VIBES = [
  'A lovely spot with so much going on!',
  'What a great area, events are waiting for you!',
  'Great location, there\'s always something happening nearby!',
  'Nice! You\'re in a buzzing area!',
  'Perfect, plenty of things to do around here!',
  'Love it, your neighbourhood has great energy!',
];

const LOGO_URL = 'https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp';

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

const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileName, setProfileName] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');

  // Compose dob string from parts
  const dob = dobYear && dobMonth && dobDay ? `${dobYear}-${dobMonth}-${dobDay}` : '';
  const [tags, setTags] = useState<string[]>([]);
  const [bio, setBio] = useState('');

  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [locationCoords, setLocationCoords] = useState<Coordinates | null>(null);
  const [locationVibe] = useState(() => LOCATION_VIBES[Math.floor(Math.random() * LOCATION_VIBES.length)]);

  const { user, profile, isProfileComplete, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const { permission: pushPermission, subscribe: pushSubscribe } = usePushNotifications();
  const { locationName, isLoading: locationNameLoading } = useLocationName(locationCoords);

  // Check current location permission state and fetch coords if already granted
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state as 'prompt' | 'granted' | 'denied');
        // If already granted, fetch the coords so we can resolve the name
        if (result.state === 'granted') {
          navigator.geolocation.getCurrentPosition(
            (pos) => setLocationCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => {},
            { timeout: 10000 }
          );
        }
        result.addEventListener('change', () => {
          setLocationPermission(result.state as 'prompt' | 'granted' | 'denied');
        });
      });
    }
  }, []);

  // Prefill from existing profile (email signup already wrote first_name +
  // last_name + profile_name via the handle_new_user trigger) and OAuth
  // metadata (Google provides full_name + avatar).
  useEffect(() => {
    if (profile?.first_name && !firstName) setFirstName(profile.first_name);
    if (profile?.last_name && !lastName) setLastName(profile.last_name);
    if (profile?.profile_name && !profileName) setProfileName(profile.profile_name);
    if (profile?.avatar_url && !avatarUrl) setAvatarUrl(profile.avatar_url);
    if (!user) return;
    const meta = user.user_metadata;
    if (meta) {
      if (meta.full_name && !firstName) {
        const parts = (meta.full_name as string).split(' ');
        setFirstName(parts[0] || '');
        if (parts.length > 1 && !lastName) setLastName(parts.slice(1).join(' '));
      }
      if (meta.avatar_url && !avatarUrl) {
        setAvatarUrl(meta.avatar_url as string);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile?.id]);

  // Default profile name to "First Last" once both are populated, but don't
  // overwrite an explicit edit (we only set it when it's still blank).
  useEffect(() => {
    if (!profileName && (firstName || lastName)) {
      setProfileName(`${firstName} ${lastName}`.trim());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, lastName]);

  // If profile is already complete on mount (before user starts), redirect to home.
  // Don't redirect once user is actively going through onboarding (step > 1)
  // or after saving profile (step 5) — let them see the final setup screen.
  // ?preview=true bypasses this for testing.
  useEffect(() => {
    if (window.location.search.includes('preview=true')) return;
    if (isProfileComplete && step === 1 && !avatarUrl) {
      navigate('/', { replace: true });
    }
  }, [isProfileComplete, navigate, step, avatarUrl]);

  // Resume onboarding after interruption (call/text on mobile backgrounds the
  // PWA and clears in-memory state). We persist the current step and form
  // fields to localStorage on every change and restore on mount, scoped per
  // user so multiple sessions on the same device don't collide.
  const resumeKey = user?.id ? `lincc-onboarding:${user.id}` : null;
  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (!resumeKey || hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    try {
      const raw = localStorage.getItem(resumeKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<{
        step: number;
        firstName: string;
        lastName: string;
        profileName: string;
        dobDay: string;
        dobMonth: string;
        dobYear: string;
        gender: Gender;
        tags: string[];
        bio: string;
      }>;
      if (saved.step && saved.step > 1) setStep(saved.step);
      if (saved.firstName) setFirstName(saved.firstName);
      if (saved.lastName) setLastName(saved.lastName);
      if (saved.profileName) setProfileName(saved.profileName);
      if (saved.dobDay) setDobDay(saved.dobDay);
      if (saved.dobMonth) setDobMonth(saved.dobMonth);
      if (saved.dobYear) setDobYear(saved.dobYear);
      if (saved.gender) setGender(saved.gender);
      if (saved.tags) setTags(saved.tags);
      if (saved.bio) setBio(saved.bio);
    } catch (err) {
      logger.warn('Failed to restore onboarding state', err);
    }
  }, [resumeKey]);

  useEffect(() => {
    if (!resumeKey || !hasRestoredRef.current) return;
    // Once the profile has been persisted, stop saving — saveProfile clears
    // the cache and we don't want to immediately rewrite it as the user
    // walks the post-save steps (install / location / notifications).
    if (isProfileComplete) return;
    try {
      localStorage.setItem(
        resumeKey,
        JSON.stringify({ step, firstName, lastName, profileName, dobDay, dobMonth, dobYear, gender, tags, bio }),
      );
    } catch {
      // Quota or private mode — fail silent; resume is best-effort.
    }
  }, [resumeKey, isProfileComplete, step, firstName, lastName, profileName, dobDay, dobMonth, dobYear, gender, tags, bio]);

  // Skip the install step entirely if the app is already installed
  const showInstallStep = !isInstalled;
  const installStep = showInstallStep ? 5 : -1;
  const locationStep = showInstallStep ? 6 : 5;
  const notificationStep = showInstallStep ? 7 : 6;
  const totalSteps = notificationStep;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file || !user) return;

    const validation = await validateImageDetailed(file);
    if (!validation.ok) {
      Sentry.captureMessage('onboarding-avatar: validation rejected file', {
        level: 'info',
        extra: { reason: validation.error, fileType: file.type, fileSize: file.size, fileName: file.name },
      });
      showToast(validation.error, 'error');
      return;
    }

    let workingFile: File = file;
    if (validation.format === 'heic') {
      setIsLoading(true);
      try {
        workingFile = await convertHeicIfNeeded(file, 'heic');
      } catch (err) {
        Sentry.captureException(err, {
          tags: { feature: 'onboarding-avatar', stage: 'heic-convert' },
          extra: { fileType: file.type, fileSize: file.size, fileName: file.name },
        });
        showToast(
          "Couldn't convert this iPhone photo. Try saving it as a JPEG and uploading again.",
          'error',
        );
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }

    // Revoke the previous source before opening with a new one — happens when
    // the user picks again via the cropper's "Choose different" button.
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(URL.createObjectURL(workingFile));
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    if (!user) return;
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setIsLoading(true);

    const filePath = `${user.id}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, croppedBlob, { contentType: 'image/jpeg' });

    if (uploadError) {
      Sentry.captureException(uploadError, {
        tags: { feature: 'onboarding-avatar', stage: 'upload' },
        extra: { filePath, blobSize: croppedBlob.size, userAgent: navigator.userAgent },
      });
      showToast(
        uploadError.message
          ? `Photo upload failed: ${uploadError.message}`
          : "Photo upload failed. Check your connection and try again.",
        'error',
      );
      setIsLoading(false);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setAvatarUrl(data.publicUrl);
    setIsLoading(false);
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        // Avatar is optional — the Avatar component renders initials from the user's
        // first name when no photo is set.
        return true;
      case 2: {
        if (!firstName.trim()) {
          showToast('Please enter your first name', 'error');
          return false;
        }
        if (!lastName.trim()) {
          showToast('Please enter your last name', 'error');
          return false;
        }
        if (!profileName.trim()) {
          showToast('Please choose a username', 'error');
          return false;
        }
        if (!dobDay || !dobMonth || !dobYear) {
          showToast('Please select your date of birth', 'error');
          return false;
        }
        if (!gender) {
          showToast('Please select your gender', 'error');
          return false;
        }
        return true;
      }
      case 3:
        if (tags.length === 0) {
          showToast('Please select at least one interest', 'error');
          return false;
        }
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    // After bio (step 4), save profile then advance to install step
    if (step === 4) {
      await saveProfile();
      return;
    }

    // Step 6 (final) — done, go home
    if (step === totalSteps) {
      navigate('/');
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1 && step < totalSteps) {
      setStep(step - 1);
    }
  };

  const saveProfile = async () => {
    if (!user?.id) return;

    setIsLoading(true);

    const profileData = {
      id: user.id as string,
      email: user.email as string,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      profile_name: profileName.trim() || `${firstName.trim()} ${lastName.trim()}`.trim() || 'User',
      dob,
      gender: gender as Gender,
      avatar_url: avatarUrl,
      tags,
      bio: bio.trim() || null,
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' });

    if (error) {
      showToast('Failed to save profile', 'error');
      logger.error(error);
    } else {
      await refreshProfile(user.id);
      // Onboarding form persisted, clear the resume cache.
      if (resumeKey) {
        try { localStorage.removeItem(resumeKey); } catch { /* ignore */ }
      }
      setStep(showInstallStep ? installStep : locationStep);
    }

    setIsLoading(false);
  };

  const handleInstall = async () => {
    await promptInstall();
  };

  const handleEnableLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationPermission('granted');
        setLocationCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => setLocationPermission('denied'),
      { timeout: 10000 }
    );
  };

  const [notifToggled, setNotifToggled] = useState(false);

  const handleEnableNotifications = async () => {
    setNotifToggled(true);
    await pushSubscribe();
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-coral/5 to-purple/5 blur-3xl pointer-events-none" />
      <div className="max-w-sm mx-auto px-4 py-12 relative">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={LOGO_URL} alt="Lincc" className="h-8" />
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full gradient-primary transition-all duration-500 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content wrapped in surface card */}
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
          {/* Step 1: Photo */}
          {step === 1 && (
            <div className="text-center">
              <h1 className="text-2xl font-bold gradient-text mb-2">Add a photo</h1>
              <p className="text-text-muted mb-8">
                Help others recognise you, or skip to use your initials.
              </p>

              <div className="flex flex-col items-center gap-4">
                <label className="cursor-pointer">
                  <div className="relative">
                    <Avatar src={avatarUrl} name={firstName || 'You'} size="xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 gradient-primary rounded-full flex items-center justify-center shadow-md">
                      <Camera className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    id="onboarding-avatar-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-text-muted">
                  Tap to upload (max 10MB). Optional, you can add one later.
                </p>
              </div>
            </div>
          )}

          {cropSrc && (
            <AvatarCropper
              src={cropSrc}
              isOpen
              onClose={handleCropCancel}
              onConfirm={handleCropConfirm}
              cropShape="round"
              aspect={1}
              pickerInputId="onboarding-avatar-input"
            />
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-bold gradient-text mb-2">
                {firstName ? `Tell us about you, ${firstName}` : 'Tell us about you'}
              </h1>
              <p className="text-text-muted mb-8">
                Pick a username and the basics.
              </p>

              <div className="space-y-4">
                {/* Fallback for users who reached onboarding without a captured
                    first/last name — typically a one-word OAuth login or an
                    older account. Skipped for the common path because we
                    already collected these on the signup form. */}
                {(!firstName.trim() || !lastName.trim()) && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Your first name"
                      autoComplete="given-name"
                    />
                    <Input
                      label="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Your last name"
                      autoComplete="family-name"
                    />
                  </div>
                )}

                <div>
                  <Input
                    label="Username"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="How others see you on Lincc"
                  />
                  <p className="text-xs text-text-muted mt-1.5">This is the name other people see. Defaults to your full name.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Date of Birth
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={dobDay}
                      onChange={(e) => setDobDay(e.target.value)}
                      className="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-text text-sm appearance-none"
                    >
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={String(d).padStart(2, '0')}>{d}</option>
                      ))}
                    </select>
                    <select
                      value={dobMonth}
                      onChange={(e) => setDobMonth(e.target.value)}
                      className="flex-[1.4] px-3 py-2.5 bg-background border border-border rounded-lg text-text text-sm appearance-none"
                    >
                      <option value="">Month</option>
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                        <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={dobYear}
                      onChange={(e) => setDobYear(e.target.value)}
                      className="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg text-text text-sm appearance-none"
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
                        onClick={() => setGender(option.value as Gender)}
                        className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors ${
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
          )}

          {/* Step 3: Interests */}
          {step === 3 && (
            <div>
              <h1 className="text-2xl font-bold gradient-text mb-2">Your interests</h1>
              <p className="text-text-muted mb-8">
                Select the activities you enjoy. This helps others find you.
              </p>

              <ChipGroup
                options={INTEREST_TAGS}
                selected={tags}
                onChange={setTags}
              />

              <p className="text-sm text-text-muted mt-4">
                {tags.length} selected
              </p>
            </div>
          )}

          {/* Step 4: Bio */}
          {step === 4 && (
            <div>
              <h1 className="text-2xl font-bold gradient-text mb-2">Write a bio</h1>
              <p className="text-text-muted mb-8">
                Share a bit about yourself. This is optional but helps others get to know you.
              </p>

              <TextArea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="I'm always up for a coffee chat or a morning run..."
                rows={4}
                maxLength={140}
                showCount
              />
            </div>
          )}

          {/* Install App (skipped if already installed) */}
          {step === installStep && (
            <div className="text-center">
              <h1 className="text-2xl font-bold gradient-text mb-2">Add to Home Screen</h1>
              <p className="text-text-muted mb-8">
                Install Lincc for the best experience. Instant access, just like a native app.
              </p>

              <div className="space-y-3 text-left">
                {/* Already installed — show confirmation */}
                {isInstalled && (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Download className="h-7 w-7 text-green-500" />
                    </div>
                    <p className="text-text-muted text-sm">Lincc is already installed!</p>
                  </div>
                )}

                {/* Native install prompt available (Android Chrome / Samsung Internet that has fired beforeinstallprompt) */}
                {!isInstalled && isInstallable && (
                  <button
                    onClick={handleInstall}
                    className="w-full p-4 bg-coral/5 rounded-xl border border-coral/20 flex items-center gap-4 hover:bg-coral/10 transition-colors"
                  >
                    <div className="w-11 h-11 bg-coral rounded-xl flex items-center justify-center flex-shrink-0">
                      <Download className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-text">Install Lincc</h3>
                      <p className="text-xs text-text-muted">Tap to add to your home screen</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-coral" />
                  </button>
                )}

                {/* No native prompt — fall back to platform-specific manual steps.
                    Covers Android browsers that haven't yet fired beforeinstallprompt,
                    iOS Safari, and the iOS-Chrome edge case (where the user must
                    re-open in Safari first). */}
                {!isInstalled && !isInstallable && (() => {
                  const platform = detectInstallPlatform();
                  const instructions = getInstallInstructions(platform);
                  if (!instructions) {
                    return (
                      <div className="text-center py-4">
                        <p className="text-text-muted text-sm">
                          You can install Lincc anytime from your browser menu.
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div className="w-full p-4 bg-coral/5 rounded-xl border border-coral/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 bg-coral rounded-xl flex items-center justify-center flex-shrink-0">
                          <Download className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-text">Add to Home Screen</h3>
                          <p className="text-xs text-text-muted">{instructions.tagline}</p>
                        </div>
                      </div>
                      <InstallSteps steps={instructions.steps} />
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Location Step */}
          {step === locationStep && (
            <div className="text-center">
              {locationPermission === 'granted' ? (
                <>
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  {locationNameLoading ? (
                    <>
                      <h1 className="text-2xl font-bold gradient-text mb-2">Finding your location...</h1>
                      <div className="mt-4 p-4 bg-blue/5 rounded-xl border border-blue/20">
                        <div className="flex items-center justify-center gap-2">
                          <MapPin className="h-4 w-4 text-blue animate-pulse" />
                          <div className="h-5 w-36 bg-border rounded-full animate-shimmer" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h1 className="text-2xl font-bold gradient-text mb-2">Location enabled</h1>
                      <div className="mt-4 p-4 bg-blue/5 rounded-xl border border-blue/20">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-blue" />
                          <span className="font-semibold text-text">{locationName || 'Location found'}</span>
                        </div>
                        <p className="text-sm text-text-muted">{locationVibe}</p>
                      </div>
                    </>
                  )}
                </>
              ) : locationPermission === 'denied' ? (
                <>
                  <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold gradient-text mb-2">Location not enabled</h1>
                  <p className="text-text-muted mb-6">
                    Lincc works best with your location. Without it, you'll miss events happening right around you.
                  </p>

                  <GradientButton onClick={handleEnableLocation} fullWidth>
                    <MapPin className="h-4 w-4 mr-2" />
                    Try Again
                  </GradientButton>

                  <p className="text-xs text-text-light mt-3">
                    If your browser blocked the request, you may need to allow location access in your browser settings and try again
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold gradient-text mb-2">Enable your location</h1>
                  <p className="text-text-muted mb-8">
                    Lincc needs your location to find events, people, and things to do near you. Without it, you'll miss out on what's happening in your area.
                  </p>

                  <GradientButton onClick={handleEnableLocation} fullWidth>
                    <MapPin className="h-4 w-4 mr-2" />
                    Allow Location Access
                  </GradientButton>

                  <p className="text-xs text-text-light mt-3">
                    You can change this anytime in Settings
                  </p>
                </>
              )}
            </div>
          )}

          {/* Notifications Step */}
          {step === notificationStep && (() => {
            const notifEnabled = pushPermission === 'granted' || notifToggled;
            return (
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 ${
                notifEnabled ? 'bg-green-500/10 animate-scale-in' : 'gradient-primary'
              }`}>
                {notifEnabled ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <Bell className="h-8 w-8 text-white" />
                )}
              </div>

              {notifEnabled ? (
                <>
                  <h1 className="text-2xl font-bold gradient-text mb-2">Notifications enabled</h1>
                  <p className="text-text-muted">
                    You'll be the first to know when something's happening near you.
                  </p>
                </>
              ) : 'Notification' in window ? (
                <>
                  <h1 className="text-2xl font-bold gradient-text mb-2">Don't miss out</h1>
                  <p className="text-text-muted mb-8">
                    People are posting events all the time. Turn on notifications so you're the first to know when something pops up nearby.
                  </p>

                  {/* Toggle-style card */}
                  <button
                    onClick={handleEnableNotifications}
                    className="w-full p-5 bg-purple/5 rounded-2xl border border-purple/20 flex items-center gap-4 hover:bg-purple/10 transition-colors text-left"
                  >
                    <div className="w-12 h-12 bg-purple rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bell className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-text">Turn on notifications</h3>
                      <p className="text-xs text-text-muted mt-0.5">Your browser will ask for permission</p>
                    </div>
                    {/* Toggle visual */}
                    <div className="w-12 h-7 bg-border rounded-full flex items-center px-0.5 flex-shrink-0">
                      <div className="w-6 h-6 bg-white rounded-full shadow-sm" />
                    </div>
                  </button>

                  <p className="text-xs text-text-light mt-3">
                    You can change this anytime in Settings
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold gradient-text mb-2">You're all set!</h1>
                  <p className="text-text-muted">
                    Notifications aren't supported on this browser, but you can check Lincc anytime to see what's happening.
                  </p>
                </>
              )}
            </div>
            );
          })()}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 1 && step < totalSteps && (
            <GradientButton
              variant="outline"
              onClick={handleBack}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </GradientButton>
          )}
          <GradientButton
            onClick={handleNext}
            fullWidth
            isLoading={isLoading}
            rightIcon={step < 4 ? <ArrowRight className="h-4 w-4" /> : undefined}
          >
            {step < 4 ? 'Continue'
              : step === 4 ? 'Save Profile'
              : step === locationStep && locationPermission === 'prompt' ? 'Skip for now'
              : step === notificationStep && !notifToggled && pushPermission !== 'granted' && pushPermission !== 'denied' ? 'Skip for now'
              : step === totalSteps ? 'Get Started'
              : 'Next'}
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
