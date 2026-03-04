import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, MapPin, Camera, X, Tag, Settings, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout';
import { Input, TextArea, GradientButton, DatePicker } from '../components/ui';
import { supabase } from '../lib/supabase';
import { compressImage, validateImageSize } from '../lib/imageCompression';
import { cn } from '../lib/utils';

type Step = 'basics' | 'pricing' | 'venue' | 'details';

const STEPS: Step[] = ['basics', 'pricing', 'venue', 'details'];

export default function CreateVoucherPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, profile } = useAuth();

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

  // Venue
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');

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

  // Access guard: non-business users
  if (!profile?.is_business) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack showLogo />
        <div className="flex flex-col items-center justify-center p-8 mt-20">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
            <Tag className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Business Account Required</h2>
          <p className="text-text-muted text-center mb-6">
            You need to switch to a business account to create vouchers. You can do this in Settings.
          </p>
          <Link to="/settings">
            <GradientButton>
              <Settings className="h-4 w-4 mr-2" />
              Go to Settings
            </GradientButton>
          </Link>
        </div>
      </div>
    );
  }

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeError = validateImageSize(file);
    if (sizeError) {
      showToast(sizeError, 'error');
      return;
    }
    setCoverImageFile(file);
    setCoverImageUrl(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleNext = () => {
    switch (step) {
      case 'basics':
        if (!title.trim()) { showToast('Please enter a title', 'error'); return; }
        if (!discountText.trim()) { showToast('Please enter the discount text', 'error'); return; }
        setStep('pricing');
        break;
      case 'pricing':
        setStep('venue');
        break;
      case 'venue':
        if (!venueName.trim()) { showToast('Please enter a venue name', 'error'); return; }
        if (!venueAddress.trim()) { showToast('Please enter a venue address', 'error'); return; }
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
      // Upload cover image if selected
      let finalCoverImageUrl = coverImageUrl;
      if (coverImageFile) {
        setIsUploading(true);
        try {
          const compressed = await compressImage(coverImageFile);
          const fileName = `${user.id}/${Date.now()}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('event-images')
            .upload(fileName, compressed, { contentType: 'image/jpeg' });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            showToast('Failed to upload image', 'error');
          } else {
            const { data: urlData } = supabase.storage
              .from('event-images')
              .getPublicUrl(fileName);
            finalCoverImageUrl = urlData.publicUrl;
          }
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
        } finally {
          setIsUploading(false);
        }
      }

      const { error } = await supabase
        .from('vouchers')
        .insert({
          business_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          discount_text: discountText.trim(),
          original_price: originalPrice ? parseFloat(originalPrice) : null,
          discounted_price: discountedPrice ? parseFloat(discountedPrice) : null,
          redemption_code: redemptionCode.trim().toUpperCase() || null,
          redemption_limit: redemptionLimit ? parseInt(redemptionLimit, 10) : null,
          terms: terms.trim() || null,
          cover_image_url: finalCoverImageUrl || null,
          venue_name: venueName.trim(),
          venue_address: venueAddress.trim(),
          venue_lat: profile?.last_lat || 51.5074, // Default to London
          venue_lng: profile?.last_lng || -0.1278,
          expires_at: expiryDate.toISOString(),
        });

      if (error) {
        console.error('Error creating voucher:', error);
        showToast(error.message || 'Failed to create voucher', 'error');
      } else {
        showToast('Voucher created!', 'success');
        navigate('/profile');
      }
    } catch (err) {
      console.error('Error:', err);
      showToast('Something went wrong', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'basics': return 'Voucher basics';
      case 'pricing': return 'Pricing & limits';
      case 'venue': return 'Where to redeem';
      case 'details': return 'Final details';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        showBack={step === 'basics'}
        showLogo
        leftContent={
          step !== 'basics' ? (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-xl text-text-muted hover:text-text hover:bg-gray-100 transition-colors"
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

        {/* Step: Venue */}
        {step === 'venue' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                <MapPin className="inline h-4 w-4 mr-1 text-coral" />
                Where can this be redeemed?
              </label>
              <Input
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="Venue name (e.g., Franco Manca Soho)"
                className="mb-2"
              />
              <Input
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                placeholder="Address (e.g., 98 Tottenham Court Rd)"
              />
            </div>

            <GradientButton fullWidth onClick={handleNext}>
              Continue
            </GradientButton>
          </div>
        )}

        {/* Step: Details */}
        {step === 'details' && (
          <div className="space-y-5">
            {/* Cover image */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">Cover image (optional)</label>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
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
                  accept="image/*"
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
                  <span className="text-text truncate ml-4">{venueName}</span>
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
