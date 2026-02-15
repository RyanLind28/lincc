import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { Button, Input, TextArea, Avatar, ChipGroup } from '../../components/ui';
import { Camera, ArrowLeft, ArrowRight } from 'lucide-react';
import { validateImageSize, compressImage } from '../../lib/imageCompression';
import type { Gender } from '../../types';

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

  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // If profile is already complete, redirect to home
  useEffect(() => {
    if (profile?.first_name) {
      navigate('/', { replace: true });
    }
  }, [profile, navigate]);

  const totalSteps = 4;

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

  const handleNext = () => {
    if (!validateStep()) return;

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
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

    // Use upsert so it works whether the profile row exists or not
    const { error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' });

    if (error) {
      showToast('Failed to save profile', 'error');
      console.error(error);
    } else {
      await refreshProfile(user.id);
      navigate('/');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Progress bar */}
        <div className="flex gap-1 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < step ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Photo */}
        {step === 1 && (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text mb-2">Add a photo</h1>
            <p className="text-text-muted mb-8">
              Help others recognize you by adding a clear photo of yourself.
            </p>

            <div className="flex flex-col items-center gap-4">
              <label className="cursor-pointer">
                <div className="relative">
                  <Avatar src={avatarUrl} size="xl" />
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
              <p className="text-sm text-text-muted">
                Tap to upload (max 10MB)
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-text mb-2">About you</h1>
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
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface text-text border-border hover:border-primary'
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
            <h1 className="text-2xl font-bold text-text mb-2">Your interests</h1>
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
            <h1 className="text-2xl font-bold text-text mb-2">Write a bio</h1>
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

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="flex-1"
            isLoading={isLoading}
            rightIcon={step < totalSteps ? <ArrowRight className="h-4 w-4" /> : undefined}
          >
            {step < totalSteps ? 'Continue' : 'Complete'}
          </Button>
        </div>
      </div>
    </div>
  );
}
