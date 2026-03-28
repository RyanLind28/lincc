import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { GradientButton, Input, TextArea, Avatar, ChipGroup } from '../../components/ui';
import { Camera, ArrowLeft, ArrowRight, Download, Bell } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { validateImageSize, compressImage } from '../../lib/imageCompression';
import type { Gender } from '../../types';

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
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [tags, setTags] = useState<string[]>([]);
  const [bio, setBio] = useState('');

  const { user, isProfileComplete, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const { permission: pushPermission, subscribe: pushSubscribe } = usePushNotifications();

  // If profile is already complete, redirect to home
  useEffect(() => {
    if (isProfileComplete) {
      navigate('/', { replace: true });
    }
  }, [isProfileComplete, navigate]);

  const totalSteps = 5;

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
        console.error(uploadError);
      } else {
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        setAvatarUrl(data.publicUrl);
      }
    } catch {
      showToast('Failed to process image', 'error');
    }

    setIsLoading(false);
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!avatarUrl) {
          showToast('Please upload a photo', 'error');
          return false;
        }
        return true;
      case 2: {
        if (!firstName.trim()) {
          showToast('Please enter your name', 'error');
          return false;
        }
        if (!dob) {
          showToast('Please enter your date of birth', 'error');
          return false;
        }
        // Check age 18+
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          showToast('You must be 18 or older to use Lincc', 'error');
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

    // After bio (step 4), save profile then advance to setup step
    if (step === 4) {
      await saveProfile();
      return;
    }

    // Step 5 (setup) — done, go home
    if (step === totalSteps) {
      navigate('/');
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1 && step < 5) {
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
      console.error(error);
    } else {
      await refreshProfile(user.id);
      setStep(5);
    }

    setIsLoading(false);
  };

  const handleInstall = async () => {
    await promptInstall();
  };

  const handleEnableNotifications = async () => {
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
        <div className="flex gap-1 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < step ? 'gradient-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step content wrapped in surface card */}
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
          {/* Step 1: Photo */}
          {step === 1 && (
            <div className="text-center">
              <h1 className="text-2xl font-bold gradient-text mb-2">Add a photo</h1>
              <p className="text-text-muted mb-8">
                Help others recognize you by adding a clear photo of yourself.
              </p>

              <div className="flex flex-col items-center gap-4">
                <label className="cursor-pointer">
                  <div className="relative">
                    <Avatar src={avatarUrl} size="xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 gradient-primary rounded-full flex items-center justify-center shadow-md">
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
                <p className="text-sm text-text-muted">
                  Tap to upload (max 10MB)
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-bold gradient-text mb-2">About you</h1>
              <p className="text-text-muted mb-8">
                Tell us a bit about yourself.
              </p>

              <div className="space-y-4">
                <Input
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                />

                <Input
                  label="Date of Birth"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  helperText="You must be 18 or older"
                />

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

          {/* Step 5: Install & Notifications */}
          {step === 5 && (
            <div className="text-center">
              <h1 className="text-2xl font-bold gradient-text mb-2">You're all set!</h1>
              <p className="text-text-muted mb-8">
                A couple more things to get the best experience.
              </p>

              <div className="space-y-4 text-left">
                {/* Install prompt */}
                {isInstallable && !isInstalled && (
                  <button
                    onClick={handleInstall}
                    className="w-full p-4 bg-background rounded-xl border border-border flex items-center gap-4 hover:border-coral transition-colors"
                  >
                    <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                      <Download className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-text">Install Lincc</h3>
                      <p className="text-sm text-text-muted">Add to your home screen for quick access</p>
                    </div>
                  </button>
                )}

                {/* Notification prompt */}
                {pushPermission !== 'granted' && 'Notification' in window && (
                  <button
                    onClick={handleEnableNotifications}
                    className="w-full p-4 bg-background rounded-xl border border-border flex items-center gap-4 hover:border-coral transition-colors"
                  >
                    <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bell className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-text">Enable Notifications</h3>
                      <p className="text-sm text-text-muted">Get notified about events, messages, and more</p>
                    </div>
                  </button>
                )}

                {pushPermission === 'granted' && !isInstallable && (
                  <p className="text-center text-text-muted text-sm py-4">
                    You're good to go!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 1 && step < 5 && (
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
            {step < 4 ? 'Continue' : step === 4 ? 'Save Profile' : 'Get Started'}
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
