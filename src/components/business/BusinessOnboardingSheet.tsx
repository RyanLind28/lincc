import { useState, useRef } from 'react';
import { BottomSheet, Input, TextArea, GradientButton } from '../ui';
import { Camera, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { activateBusinessProfile } from '../../services/businessService';
import { supabase } from '../../lib/supabase';
import { compressImage, validateImageSize } from '../../lib/imageCompression';
import { BUSINESS_CATEGORIES } from '../../types';
import { cn } from '../../lib/utils';

type OnboardingStep = 'name' | 'details' | 'logo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function BusinessOnboardingSheet({ isOpen, onClose }: Props) {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<OnboardingStep>('name');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeError = validateImageSize(file);
    if (sizeError) {
      showToast(sizeError, 'error');
      return;
    }

    setLogoFile(file);
    setLogoUrl(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoUrl(null);
  };

  const handleComplete = async () => {
    if (!user?.id) return;

    setIsSubmitting(true);

    try {
      let uploadedLogoUrl: string | undefined;

      // Upload logo if selected
      if (logoFile) {
        const compressed = await compressImage(logoFile);
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('business-logos')
          .upload(fileName, compressed, { contentType: 'image/jpeg' });

        if (uploadError) {
          console.error('Logo upload error:', uploadError);
          showToast('Failed to upload logo, continuing without it', 'error');
        } else {
          const { data: urlData } = supabase.storage
            .from('business-logos')
            .getPublicUrl(fileName);
          uploadedLogoUrl = urlData.publicUrl;
        }
      }

      const result = await activateBusinessProfile(user.id, {
        business_name: businessName.trim(),
        business_category: category,
        business_description: description.trim() || undefined,
        business_address: address.trim() || undefined,
        business_logo_url: uploadedLogoUrl,
      });

      if (result.success) {
        await refreshProfile(user.id);
        showToast('Business profile activated!', 'success');
        resetAndClose();
      } else {
        showToast(result.error || 'Failed to activate business profile', 'error');
      }
    } catch (err) {
      console.error('Business onboarding error:', err);
      showToast('Something went wrong', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep('name');
    setBusinessName('');
    setCategory('');
    setDescription('');
    setAddress('');
    setLogoUrl(null);
    setLogoFile(null);
    onClose();
  };

  const canProceedFromName = businessName.trim().length > 0 && category.length > 0;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Switch to Business"
      height="auto"
    >
      <div className="space-y-5 pb-4">
        {/* Progress indicator */}
        <div className="flex gap-2">
          {(['name', 'details', 'logo'] as OnboardingStep[]).map((s, i) => (
            <div
              key={s}
              className={cn(
                'flex-1 h-1 rounded-full transition-all',
                i <= ['name', 'details', 'logo'].indexOf(step)
                  ? 'gradient-primary'
                  : 'bg-border'
              )}
            />
          ))}
        </div>

        {/* Step 1: Name + Category */}
        {step === 'name' && (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Set up your business profile to create vouchers and promote your business on Lincc.
            </p>

            <Input
              label="Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., The Garden Kitchen"
              maxLength={80}
            />

            <div>
              <label className="block text-sm font-medium text-text mb-2">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left',
                      category === cat
                        ? 'border-coral bg-coral/5 text-coral'
                        : 'border-border text-text-muted hover:border-coral/50'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <GradientButton
              fullWidth
              onClick={() => setStep('details')}
              disabled={!canProceedFromName}
            >
              Continue
            </GradientButton>
          </div>
        )}

        {/* Step 2: Description + Address */}
        {step === 'details' && (
          <div className="space-y-4">
            <TextArea
              label="Business Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell people about your business..."
              rows={3}
              maxLength={280}
              showCount
            />

            <Input
              label="Business Address (optional)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., 123 High Street, London"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setStep('name')}
                className="flex-1 py-3 rounded-xl border border-border text-text-muted font-medium hover:border-coral hover:text-coral transition-colors"
              >
                Back
              </button>
              <GradientButton
                className="flex-1"
                onClick={() => setStep('logo')}
              >
                Continue
              </GradientButton>
            </div>
          </div>
        )}

        {/* Step 3: Logo Upload */}
        {step === 'logo' && (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Add a logo for your business (optional). You can always add or change this later.
            </p>

            <div className="flex flex-col items-center gap-4">
              {logoUrl ? (
                <div className="relative">
                  <img
                    src={logoUrl}
                    alt="Business logo preview"
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-border"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-error rounded-full flex items-center justify-center text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-text-muted hover:border-coral hover:text-coral transition-colors"
                >
                  <Camera className="h-6 w-6 mb-1" />
                  <span className="text-xs font-medium">Upload</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="hidden"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('details')}
                className="flex-1 py-3 rounded-xl border border-border text-text-muted font-medium hover:border-coral hover:text-coral transition-colors"
              >
                Back
              </button>
              <GradientButton
                className="flex-1"
                onClick={handleComplete}
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Activating...
                  </>
                ) : (
                  'Activate Business'
                )}
              </GradientButton>
            </div>

            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="w-full text-center text-sm text-text-muted hover:text-coral transition-colors"
            >
              Skip logo for now
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
