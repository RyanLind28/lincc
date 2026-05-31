import { logger } from '../../lib/utils';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { GradientButton, AvatarCropper } from '../../components/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useLocationName } from '../../hooks/useLocationName';
import { PhotoStep, NameStep, BirthdayStep, InterestsStep, BioStep, InstallStep, LocationStep, NotificationStep } from './steps';
import { GuidelinesIntro } from '../../components/onboarding/GuidelinesIntro';
import { validateImageDetailed, convertHeicIfNeeded } from '../../lib/imageCompression';
import { logUpload } from '../../lib/uploadDebug';
import { UploadDebugPanel, CropperErrorBoundary } from '../../components/ui';
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

// Fixed pre-save steps. Photo and Bio are optional (skippable); Name, Birthday
// and Interests are required and gated. Bio is the last step before we persist
// the profile — the install/location/notification steps that follow are
// computed because Install is skipped entirely when the app is already added.
const PHOTO_STEP = 1;
const NAME_STEP = 2;
const BIRTHDAY_STEP = 3;
const INTERESTS_STEP = 4;
const BIO_STEP = 5;


export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [guidelinesAcknowledged, setGuidelinesAcknowledged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileName, setProfileName] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
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

  // Debounced username availability check. Hits the unique index from
  // migration 049 — case-insensitive, whitespace-trimmed. Excludes the
  // current user's own row so editing your existing username doesn't trip
  // the "taken" state.
  useEffect(() => {
    const trimmed = profileName.trim();
    if (!trimmed) {
      setUsernameStatus('idle');
      return;
    }
    // Skip the network call if the user hasn't changed their existing name
    if (profile?.profile_name && trimmed.toLowerCase() === profile.profile_name.trim().toLowerCase()) {
      setUsernameStatus('available');
      return;
    }
    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      const query = supabase
        .from('profiles')
        .select('id')
        .ilike('profile_name', trimmed)
        .limit(1);
      if (user?.id) query.neq('id', user.id);
      const { data, error } = await query;
      if (error) {
        // Don't block the user on a network blip; let saveProfile catch it
        setUsernameStatus('idle');
        return;
      }
      setUsernameStatus(data && data.length > 0 ? 'taken' : 'available');
    }, 400);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileName, user?.id, profile?.profile_name]);

  // If profile is already complete on mount (before user starts), redirect to home.
  // Don't redirect once user is actively going through onboarding (step > 1)
  // or after saving profile (post-save steps) — let them see the final setup screen.
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
        guidelinesAcknowledged: boolean;
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
      // Restore the guidelines acknowledgement first, independent of step.
      // Taking a selfie on the photo step (step 1) backgrounds the PWA on
      // Android and remounts this page, resetting guidelinesAcknowledged to
      // false — without this the user gets bounced back to the guidelines
      // screen mid-onboarding.
      if (saved.guidelinesAcknowledged) setGuidelinesAcknowledged(true);
      // Only restore pre-save steps. Post-save steps aren't persisted, and a
      // stale cache from an older step layout must not drop the user past save.
      // Resuming mid-flow means they've already seen the guidelines intro.
      if (saved.step && saved.step > 1 && saved.step <= BIO_STEP) {
        setStep(saved.step);
        setGuidelinesAcknowledged(true);
      }
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
        JSON.stringify({ step, guidelinesAcknowledged, firstName, lastName, profileName, dobDay, dobMonth, dobYear, gender, tags, bio }),
      );
    } catch {
      // Quota or private mode — fail silent; resume is best-effort.
    }
  }, [resumeKey, isProfileComplete, step, guidelinesAcknowledged, firstName, lastName, profileName, dobDay, dobMonth, dobYear, gender, tags, bio]);

  // Skip the install step entirely if the app is already installed. These sit
  // after BIO_STEP (the save point).
  const showInstallStep = !isInstalled;
  const installStep = showInstallStep ? BIO_STEP + 1 : -1;
  const locationStep = showInstallStep ? BIO_STEP + 2 : BIO_STEP + 1;
  const notificationStep = showInstallStep ? BIO_STEP + 3 : BIO_STEP + 2;
  const totalSteps = notificationStep;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    logUpload('onChange:fired', `files=${e.target.files?.length ?? 0}`);
    const file = e.target.files?.[0];
    if (!file || !user) {
      logUpload('onChange:no-file-or-user', `file=${!!file} user=${!!user}`);
      return;
    }
    setPhotoError(null);

    // Validate (and read bytes into a JS-owned File) BEFORE clearing the
    // input. On Samsung Android, clearing `input.value` can revoke the
    // picker's Content URI permission, which makes the subsequent
    // arrayBuffer() throw NotReadableError.
    setIsRecovering(true);
    let validation;
    try {
      validation = await validateImageDetailed(file);
    } catch (err) {
      logUpload('validate:threw', err instanceof Error ? err.message : String(err));
      Sentry.captureException(err, { tags: { feature: 'onboarding-avatar', stage: 'validate-threw' } });
      setPhotoError("Couldn't read that photo. Try another, or take one with your camera.");
      setIsRecovering(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    } finally {
      setIsRecovering(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (!validation.ok) {
      Sentry.captureMessage('onboarding-avatar: validation rejected file', {
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
      setPhotoError(validation.error);
      return;
    }

    if (validation.recovered) {
      Sentry.captureMessage('onboarding-avatar: recovered unreadable file', {
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

    let workingFile: File = validation.file;

    if (validation.format === 'heic') {
      setIsLoading(true);
      try {
        workingFile = await convertHeicIfNeeded(workingFile, 'heic');
      } catch (err) {
        Sentry.captureException(err, {
          tags: { feature: 'onboarding-avatar', stage: 'heic-convert' },
          extra: { fileType: workingFile.type, fileSize: workingFile.size, fileName: workingFile.name },
        });
        setPhotoError("Couldn't convert this iPhone photo. Try saving it as a JPEG and uploading again.");
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }

    // Revoke the previous source before opening with a new one — happens when
    // the user picks again via the cropper's "Choose different" button.
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(URL.createObjectURL(workingFile));
    logUpload('handler:cropper-open', `${workingFile.size}b`);
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    logUpload('crop:confirm', `${croppedBlob.size}b`);
    if (!user) return;
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setIsLoading(true);

    const filePath = `${user.id}/${Date.now()}.jpg`;
    logUpload('upload:start', filePath);
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, croppedBlob, { contentType: 'image/jpeg' });
    logUpload('upload:done', uploadError ? `ERR ${uploadError.message}` : 'ok');

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
    setPhotoError(null);
    setIsLoading(false);
    logUpload('save:done', 'avatar set');
  };

  const validateStep = () => {
    switch (step) {
      case PHOTO_STEP:
        // Avatar is optional — the Avatar component renders initials from the user's
        // first name when no photo is set.
        return true;
      case NAME_STEP: {
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
        if (usernameStatus === 'taken') {
          showToast('That username is already taken. Try another.', 'error');
          return false;
        }
        if (usernameStatus === 'checking') {
          showToast('Checking username…', 'info');
          return false;
        }
        return true;
      }
      case BIRTHDAY_STEP: {
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
      case INTERESTS_STEP:
        if (tags.length === 0) {
          showToast('Please select at least one interest', 'error');
          return false;
        }
        return true;
      case BIO_STEP:
        // Bio is optional — skipping saves with a null bio.
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    // After bio, save profile then advance to the install step
    if (step === BIO_STEP) {
      await saveProfile();
      return;
    }

    // Final step — done, go home
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
      // Unique violation on profile_name — surface the exact reason so the
      // user can pick a different one without going round again.
      if (error.code === '23505' && /profile_name/i.test(error.message)) {
        showToast('That username is already taken. Try another.', 'error');
        setStep(2); // step back to About You so they can edit it
      } else {
        showToast('Failed to save profile', 'error');
        logger.error(error);
      }
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

  // Show the community guidelines once, up front, before the step wizard.
  if (!guidelinesAcknowledged) {
    return <GuidelinesIntro variant="personal" onContinue={() => setGuidelinesAcknowledged(true)} />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <UploadDebugPanel />
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
          {step === PHOTO_STEP && (
            <PhotoStep
              avatarUrl={avatarUrl}
              firstName={firstName}
              isRecovering={isRecovering}
              photoError={photoError}
              fileInputRef={fileInputRef}
              onPhotoSelect={handlePhotoSelect}
              onClearError={() => setPhotoError(null)}
              onRemovePhoto={() => { setAvatarUrl(null); setPhotoError(null); }}
            />
          )}

          {cropSrc && (
            <CropperErrorBoundary>
              <AvatarCropper
                src={cropSrc}
                isOpen
                onClose={handleCropCancel}
                onConfirm={handleCropConfirm}
                cropShape="round"
                aspect={1}
                pickerInputId="onboarding-avatar-input"
              />
            </CropperErrorBoundary>
          )}

          {step === NAME_STEP && (
            <NameStep
              firstName={firstName}
              lastName={lastName}
              profileName={profileName}
              usernameStatus={usernameStatus}
              onFirstNameChange={setFirstName}
              onLastNameChange={setLastName}
              onProfileNameChange={setProfileName}
            />
          )}

          {step === BIRTHDAY_STEP && (
            <BirthdayStep
              dobDay={dobDay}
              dobMonth={dobMonth}
              dobYear={dobYear}
              gender={gender}
              onDobDayChange={setDobDay}
              onDobMonthChange={setDobMonth}
              onDobYearChange={setDobYear}
              onGenderChange={setGender}
            />
          )}

          {step === INTERESTS_STEP && (
            <InterestsStep tags={tags} onTagsChange={setTags} />
          )}

          {step === BIO_STEP && (
            <BioStep bio={bio} onBioChange={setBio} />
          )}

          {step === installStep && (
            <InstallStep
              isInstalled={isInstalled}
              isInstallable={isInstallable}
              onInstall={handleInstall}
            />
          )}

          {step === locationStep && (
            <LocationStep
              locationPermission={locationPermission}
              locationName={locationName}
              locationNameLoading={locationNameLoading}
              locationVibe={locationVibe}
              onEnableLocation={handleEnableLocation}
            />
          )}

          {step === notificationStep && (
            <NotificationStep
              pushPermission={pushPermission}
              notifToggled={notifToggled}
              onEnableNotifications={handleEnableNotifications}
            />
          )}
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
            rightIcon={step < BIO_STEP ? <ArrowRight className="h-4 w-4" /> : undefined}
          >
            {step === PHOTO_STEP ? (avatarUrl ? 'Continue' : 'Skip for now')
              : step === NAME_STEP || step === BIRTHDAY_STEP || step === INTERESTS_STEP ? 'Continue'
              : step === BIO_STEP ? (bio.trim() ? 'Save Profile' : 'Skip for now')
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
