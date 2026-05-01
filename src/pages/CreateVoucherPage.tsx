import { logger } from '../lib/utils';
import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, MapPin, Camera, X, Tag, Store, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout';
import { Input, TextArea, GradientButton, DatePicker } from '../components/ui';
import { supabase } from '../lib/supabase';
import { compressImage, validateImageDetailed, convertHeicIfNeeded } from '../lib/imageCompression';
import * as Sentry from '@sentry/react';
import { getLocationsByBusiness } from '../services/businessService';
import { cn } from '../lib/utils';
import type { BusinessLocation } from '../types';

type Step = 'basics' | 'pricing' | 'location' | 'details';

const STEPS: Step[] = ['basics', 'pricing', 'location', 'details'];

export default function CreateVoucherPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, profile, business, isBusinessApproved } = useAuth();

  const selectedBusiness = business;
  const [step, setStep] = useState<Step>('basics');

  // Basics
  const [title, setTitle] = useState('');
  const [discountText, setDiscountText] = useState('');
  const [description, setDescription] = useState('');

  // Pricing
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [redemptionCode, setRedemptionCode] = useState('');
  const [redemptionLimit, setRedemptionLimit] = useState('');

  // Location
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<BusinessLocation | null>(null);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Details
  const [terms, setTerms] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentStepIndex = STEPS.indexOf(step);

  // Max expiry: 6 months out
  const maxDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

  // Personal accounts: full block.
  if (profile && profile.account_type !== 'business') {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack showLogo />
        <div className="flex flex-col items-center justify-center p-8 mt-20">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Vouchers are for businesses</h2>
          <p className="text-text-muted text-center mb-6">
            Sign up as a business and get approved to start publishing vouchers.
          </p>
          <Link to="/"><GradientButton>Back home</GradientButton></Link>
        </div>
      </div>
    );
  }

  // Business accounts that aren't approved yet: friendly verify-prompt.
  if (!selectedBusiness || !isBusinessApproved) {
    return (
      <div className="min-h-screen bg-background max-w-2xl mx-auto">
        <Header showBack showLogo />
        <div className="p-4 mt-8 bg-surface rounded-2xl border border-border text-center">
          <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="h-8 w-8 text-warning" />
          </div>
          <h1 className="text-xl font-bold text-text mb-2">Verification needed</h1>
          <p className="text-sm text-text-muted mb-4">
            You can publish vouchers once your business is approved. Submit your verification documents to speed it up.
          </p>
          <div className="flex gap-2 justify-center">
            <Link to="/business/verify"><GradientButton size="md">Verify business</GradientButton></Link>
            <Link to="/business/dashboard">
              <button className="h-10 px-4 rounded-xl border border-border text-text hover:border-coral text-sm font-medium">
                Open dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    const validation = await validateImageDetailed(file);
    if (!validation.ok) {
      Sentry.captureMessage('voucher-cover: validation rejected file', {
        level: 'info',
        extra: { reason: validation.error, fileType: file.type, fileSize: file.size, fileName: file.name },
      });
      showToast(validation.error, 'error');
      return;
    }

    let workingFile = file;
    if (validation.format === 'heic') {
      setIsUploading(true);
      try {
        workingFile = await convertHeicIfNeeded(file, 'heic');
      } catch (err) {
        Sentry.captureException(err, {
          tags: { feature: 'voucher-cover', stage: 'heic-convert' },
          extra: { fileType: file.type, fileSize: file.size, fileName: file.name },
        });
        showToast(
          "Couldn't convert this iPhone photo. Try saving it as a JPEG and uploading again.",
          'error',
        );
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    setCoverImageFile(workingFile);
    setCoverImageUrl(URL.createObjectURL(workingFile));
  };

  const handleCoverImageReset = () => {
    setCoverImageFile(null);
    setCoverImageUrl(null);
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(STEPS[prevIndex]);
    } else {
      navigate(-1);
    }
  };

  const handleNext = async () => {
    switch (step) {
      case 'basics':
        if (!title.trim()) { showToast('Please enter a title', 'error'); return; }
        if (!discountText.trim()) { showToast('Please enter the discount text', 'error'); return; }
        setStep('pricing');
        break;
      case 'pricing':
        // Load locations for selected business before showing location step
        if (selectedBusiness) {
          setIsLoadingLocations(true);
          const locs = await getLocationsByBusiness(selectedBusiness.id);
          setLocations(locs);
          // Auto-select if only one location
          if (locs.length === 1) {
            setSelectedLocation(locs[0]);
          }
          setIsLoadingLocations(false);
        }
        setStep('location');
        break;
      case 'location':
        if (!selectedLocation) { showToast('Please select a location', 'error'); return; }
        setStep('details');
        break;
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      showToast('Please log in', 'error');
      return;
    }

    if (!expiryDate) {
      showToast('Please select an expiry date', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Upload cover image if selected. Abort the whole submit on failure rather
      // than silently saving a voucher without the image the user picked.
      let finalCoverImageUrl = coverImageUrl;
      if (coverImageFile) {
        setIsUploading(true);
        let compressed: Blob;
        try {
          compressed = await compressImage(coverImageFile);
        } catch (err) {
          Sentry.captureException(err, {
            tags: { feature: 'voucher-cover', stage: 'compress' },
            extra: {
              fileType: coverImageFile.type,
              fileSize: coverImageFile.size,
              fileName: coverImageFile.name,
              userAgent: navigator.userAgent,
            },
          });
          showToast(
            "Couldn't process that image. Try a smaller photo or a different format (JPG/PNG).",
            'error',
          );
          setIsUploading(false);
          setIsLoading(false);
          return;
        }

        const fileName = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, compressed, { contentType: 'image/jpeg' });

        if (uploadError) {
          Sentry.captureException(uploadError, {
            tags: { feature: 'voucher-cover', stage: 'upload' },
            extra: { fileName, compressedSize: compressed.size, userAgent: navigator.userAgent },
          });
          showToast(
            uploadError.message
              ? `Image upload failed: ${uploadError.message}`
              : "Image upload failed. Check your connection and try again.",
            'error',
          );
          setIsUploading(false);
          setIsLoading(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName);
        finalCoverImageUrl = urlData.publicUrl;
        setIsUploading(false);
      }

      const { error } = await supabase
        .from('vouchers')
        .insert({
          business_id: selectedBusiness!.id,
          title: title.trim(),
          description: description.trim() || null,
          discount_text: discountText.trim(),
          original_price: originalPrice ? parseFloat(originalPrice) : null,
          discounted_price: discountedPrice ? parseFloat(discountedPrice) : null,
          redemption_code: redemptionCode.trim().toUpperCase() || null,
          redemption_limit: redemptionLimit ? parseInt(redemptionLimit, 10) : null,
          terms: terms.trim() || null,
          cover_image_url: finalCoverImageUrl || null,
          venue_name: selectedLocation?.name || '',
          venue_address: selectedLocation?.address || '',
          venue_lat: selectedLocation?.lat || 0,
          venue_lng: selectedLocation?.lng || 0,
          location_id: selectedLocation?.id || null,
          expires_at: expiryDate.toISOString(),
        });

      if (error) {
        logger.error('Error creating voucher:', error);
        showToast(error.message || 'Failed to create voucher', 'error');
      } else {
        showToast('Voucher created!', 'success');
        navigate('/profile');
      }
    } catch (err) {
      logger.error('Error:', err);
      showToast('Something went wrong', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'basics': return 'Voucher basics';
      case 'pricing': return 'Pricing & limits';
      case 'location': return 'Where to redeem';
      case 'details': return 'Final details';
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-2xl mx-auto">
      <Header
        showBack={step === 'basics'}
        showLogo
        leftContent={
          step !== 'basics' ? (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-xl text-text-muted hover:text-text hover:bg-background transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : undefined
        }
      />

      <div className="p-4">
        {/* Progress bar */}
        <div className="relative mb-8">
          <div className="h-1.5 bg-border rounded-full" />
          <div
            className="absolute top-0 left-0 h-1.5 gradient-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
          />
          <div className="absolute top-0 left-0 right-0 flex justify-between" style={{ transform: 'translateY(-25%)' }}>
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={cn(
                  'w-3 h-3 rounded-full border-2 transition-all',
                  i <= currentStepIndex
                    ? 'gradient-primary border-purple'
                    : 'bg-surface border-border'
                )}
              />
            ))}
          </div>
        </div>

        {/* Step title */}
        <h1 className="text-2xl font-bold text-text mb-6">{getStepTitle()}</h1>

        {/* Step: Basics */}
        {step === 'basics' && (
          <div className="space-y-5">
            <Input
              label="Voucher title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='e.g., "20% Off Any Pizza"'
              maxLength={80}
            />

            <Input
              label="Discount text"
              value={discountText}
              onChange={(e) => setDiscountText(e.target.value)}
              placeholder='e.g., "20% OFF", "2-for-1", "FREE"'
              maxLength={30}
            />

            <TextArea
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this voucher include?"
              rows={3}
              maxLength={280}
              showCount
            />

            <GradientButton fullWidth onClick={handleNext}>
              Continue
            </GradientButton>
          </div>
        )}

        {/* Step: Pricing */}
        {step === 'pricing' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Original price"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="e.g., 15.00"
                type="number"
              />
              <Input
                label="Discounted price"
                value={discountedPrice}
                onChange={(e) => setDiscountedPrice(e.target.value)}
                placeholder="e.g., 12.00"
                type="number"
              />
            </div>

            <Input
              label="Redemption code (optional)"
              value={redemptionCode}
              onChange={(e) => setRedemptionCode(e.target.value)}
              placeholder='e.g., "PIZZA20"'
              maxLength={20}
            />

            <Input
              label="Total redemption limit (optional)"
              value={redemptionLimit}
              onChange={(e) => setRedemptionLimit(e.target.value)}
              placeholder="Leave blank for unlimited"
              type="number"
            />

            <GradientButton fullWidth onClick={handleNext}>
              Continue
            </GradientButton>
          </div>
        )}

        {/* Step: Location */}
        {step === 'location' && (
          <div className="space-y-5">
            {isLoadingLocations ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-surface rounded-xl border border-border animate-pulse" />
                ))}
              </div>
            ) : locations.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-8 w-8 text-text-light mx-auto mb-2" />
                <p className="text-text-muted mb-3">No locations added to this business yet.</p>
                <Link to="/business/dashboard" className="text-sm text-coral font-medium">
                  Add locations in your dashboard
                </Link>
              </div>
            ) : (
              <>
                <p className="text-text-muted text-sm">Select where this voucher can be redeemed:</p>
                <div className="space-y-2">
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocation(loc)}
                      className={cn(
                        'w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all',
                        selectedLocation?.id === loc.id
                          ? 'border-coral bg-coral/5'
                          : 'border-border hover:border-coral/50'
                      )}
                    >
                      <MapPin className={cn('h-5 w-5 flex-shrink-0', selectedLocation?.id === loc.id ? 'text-coral' : 'text-text-muted')} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text">{loc.name}</p>
                        <p className="text-sm text-text-muted truncate">{loc.address}</p>
                      </div>
                      {loc.is_primary && (
                        <span className="text-[10px] font-medium text-coral bg-coral/10 px-2 py-0.5 rounded-full flex-shrink-0">Primary</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {locations.length > 0 && (
              <GradientButton fullWidth onClick={handleNext}>
                Continue
              </GradientButton>
            )}
          </div>
        )}

        {/* Step: Details */}
        {step === 'details' && (
          <div className="space-y-5">
            {/* Cover image */}
            <div>
              <label className="block text-sm font-medium text-text mb-1">Cover photo</label>
              <p className="text-xs text-text-muted mb-2">Upload a photo of the product or venue. Optional, but recommended.</p>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-background">
                {coverImageUrl ? (
                  <img
                    src={coverImageUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full gradient-primary flex items-center justify-center">
                    <Tag className="h-12 w-12 text-white" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-colors"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  {coverImageFile && (
                    <button
                      type="button"
                      onClick={handleCoverImageReset}
                      className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.heic,.heif"
                  onChange={handleCoverImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Expiry date */}
            <div>
              <label className="block text-sm font-medium text-text mb-3">
                Expiry date
              </label>
              <DatePicker
                value={expiryDate}
                onChange={setExpiryDate}
                maxDate={maxDate}
                className="border border-border"
              />
            </div>

            {/* Terms */}
            <TextArea
              label="Terms & conditions (optional)"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="e.g., Valid on pizzas only. Cannot be combined with other offers."
              rows={3}
              maxLength={500}
              showCount
            />

            {/* Summary */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <h3 className="font-semibold text-text">Voucher Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Title</span>
                  <span className="text-text truncate ml-4">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Discount</span>
                  <span className="text-coral font-semibold">{discountText}</span>
                </div>
                {originalPrice && discountedPrice && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Price</span>
                    <span className="text-text">
                      <span className="line-through text-text-muted mr-1">&pound;{originalPrice}</span>
                      &pound;{discountedPrice}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-muted">Venue</span>
                  <span className="text-text truncate ml-4">{selectedLocation?.name || '—'}</span>
                </div>
                {expiryDate && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Expires</span>
                    <span className="text-text">
                      {expiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {redemptionCode && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Code</span>
                    <span className="text-text font-mono">{redemptionCode.toUpperCase()}</span>
                  </div>
                )}
                {redemptionLimit && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Limit</span>
                    <span className="text-text">{redemptionLimit} uses</span>
                  </div>
                )}
              </div>
            </div>

            <GradientButton
              fullWidth
              size="lg"
              onClick={handleSubmit}
              isLoading={isLoading || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Uploading image...
                </>
              ) : (
                'Create Voucher'
              )}
            </GradientButton>
          </div>
        )}
      </div>
    </div>
  );
}
