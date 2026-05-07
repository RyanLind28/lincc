import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Header } from '../components/layout';
import { Input, TextArea, GradientButton, PlacesAutocomplete, AvatarCropper } from '../components/ui';
import type { PlaceDetails } from '../services/placesService';
import { useUserLocation } from '../hooks/useUserLocation';
import { Camera, X, Loader2, AlertTriangle } from 'lucide-react';
import { updateBusiness } from '../services/businessService';
import { supabase } from '../lib/supabase';
import { compressImage, validateImageDetailed, convertHeicIfNeeded } from '../lib/imageCompression';
import { BUSINESS_CATEGORIES } from '../types';
import { cn } from '../lib/utils';
import type { BusinessOpeningHours } from '../types';

type LogoStatus = 'idle' | 'converting' | 'compressing' | 'uploading';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

export default function EditBusinessProfilePage() {
  const navigate = useNavigate();
  const { business, profile, refreshBusiness } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { location: userLocation } = useUserLocation();

  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [hours, setHours] = useState<BusinessOpeningHours>({});
  const [isSaving, setIsSaving] = useState(false);
  const [logoStatus, setLogoStatus] = useState<LogoStatus>('idle');

  useEffect(() => {
    if (business) {
      setBusinessName(business.name);
      setCategory(business.category);
      setDescription(business.description || '');
      setAddress(business.address || '');
      setLogoUrl(business.logo_url);
      setHours(business.opening_hours || {});
    }
  }, [business]);

  // Access guard
  if (profile && profile.account_type !== 'business') {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack showLogo />
        <div className="flex flex-col items-center justify-center p-8 mt-20">
          <AlertTriangle className="h-8 w-8 text-error mb-4" />
          <h2 className="text-xl font-semibold text-text mb-2">Business accounts only</h2>
          <GradientButton onClick={() => navigate('/')}>Home</GradientButton>
        </div>
      </div>
    );
  }
  if (!business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-coral animate-spin" />
      </div>
    );
  }

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset value first — re-selecting the same file later still fires onChange.
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    const validation = await validateImageDetailed(file);
    if (!validation.ok) {
      Sentry.captureMessage('business-logo: validation rejected file', {
        level: 'info',
        extra: { reason: validation.error, fileType: file.type, fileSize: file.size, fileName: file.name },
      });
      showToast(validation.error, 'error');
      return;
    }

    // HEIC photos (typical iPhone / WhatsApp share) need to be converted before
    // anything else can decode them — Android Chrome can't render HEIC natively.
    let workingFile = file;
    if (validation.format === 'heic') {
      setLogoStatus('converting');
      try {
        workingFile = await convertHeicIfNeeded(file, 'heic');
      } catch (err) {
        Sentry.captureException(err, {
          tags: { feature: 'business-logo', stage: 'heic-convert' },
          extra: { fileType: file.type, fileSize: file.size, fileName: file.name },
        });
        showToast(
          "Couldn't convert this iPhone photo. Try saving it as a JPEG and uploading again.",
          'error',
        );
        setLogoStatus('idle');
        return;
      }
    }

    setLogoStatus('idle');
    // Revoke the previous source before opening with a new one — happens when
    // the user picks again via the cropper's "Choose different" button.
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(URL.createObjectURL(workingFile));
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const handleCropConfirm = (croppedBlob: Blob) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    const file = new File([croppedBlob], `logo-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setLogoFile(file);
    setLogoUrl(URL.createObjectURL(croppedBlob));
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoUrl(null);
  };

  const toggleDay = (day: string) => {
    const current = hours[day as keyof BusinessOpeningHours];
    if (current) {
      const updated = { ...hours };
      updated[day as keyof BusinessOpeningHours] = null;
      setHours(updated);
    } else {
      setHours({ ...hours, [day]: { open: '09:00', close: '17:00' } });
    }
  };

  const updateDayHours = (day: string, field: 'open' | 'close', value: string) => {
    const current = hours[day as keyof BusinessOpeningHours];
    if (!current) return;
    setHours({ ...hours, [day]: { ...current, [field]: value } });
  };

  const handleSave = async () => {
    if (!business?.id || !businessName.trim()) {
      showToast('Business name is required', 'error');
      return;
    }

    setIsSaving(true);

    try {
      let uploadedLogoUrl: string | undefined;

      if (logoFile && business.owner_id) {
        // Compress
        let compressed: Blob;
        setLogoStatus('compressing');
        try {
          compressed = await compressImage(logoFile);
        } catch (err) {
          Sentry.captureException(err, {
            tags: { feature: 'business-logo', stage: 'compress' },
            extra: {
              fileType: logoFile.type,
              fileSize: logoFile.size,
              fileName: logoFile.name,
              userAgent: navigator.userAgent,
            },
          });
          showToast(
            "Couldn't process that image. Try a smaller photo or a different format (JPG/PNG).",
            'error',
          );
          setLogoStatus('idle');
          setIsSaving(false);
          return;
        }

        // Upload — abort the whole save if this fails. Previously we showed
        // "Failed to upload logo" but kept going and toasted "Business updated!",
        // leaving the user thinking the new image had saved when it hadn't.
        setLogoStatus('uploading');
        const fileName = `${business.owner_id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('business-logos')
          .upload(fileName, compressed, { contentType: 'image/jpeg' });

        if (uploadError) {
          Sentry.captureException(uploadError, {
            tags: { feature: 'business-logo', stage: 'upload' },
            extra: {
              fileName,
              compressedSize: compressed.size,
              ownerId: business.owner_id,
              userAgent: navigator.userAgent,
            },
          });
          showToast(
            uploadError.message
              ? `Logo upload failed: ${uploadError.message}`
              : "Logo upload failed. Check your connection and try again.",
            'error',
          );
          setLogoStatus('idle');
          setIsSaving(false);
          return;
        }

        const { data: urlData } = supabase.storage.from('business-logos').getPublicUrl(fileName);
        uploadedLogoUrl = urlData.publicUrl;
        setLogoStatus('idle');
      }

      const result = await updateBusiness(business.id, {
        name: businessName.trim(),
        category,
        description: description.trim() || null,
        address: address.trim() || null,
        logo_url: uploadedLogoUrl ?? logoUrl ?? null,
        opening_hours: Object.keys(hours).length > 0 ? hours : null,
      });

      if (result.success) {
        showToast('Business updated!', 'success');
        await refreshBusiness();
        navigate('/business/dashboard');
      } else {
        Sentry.captureMessage('business-logo: updateBusiness failed', {
          level: 'error',
          extra: { error: result.error, businessId: business.id },
        });
        showToast(result.error || 'Failed to update', 'error');
      }
    } catch (err) {
      Sentry.captureException(err, { tags: { feature: 'business-logo', stage: 'save' } });
      showToast('Something went wrong', 'error');
    } finally {
      setLogoStatus('idle');
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header showBack showLogo />

      {cropSrc && (
        <AvatarCropper
          src={cropSrc}
          isOpen
          onClose={handleCropCancel}
          onConfirm={handleCropConfirm}
          cropShape="rect"
          aspect={1}
          title="Crop your logo"
          pickerInputId="business-logo-input"
        />
      )}

      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold text-text">Edit Business</h1>

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">Business Logo</label>
          <div className="flex items-center gap-4">
            {logoStatus !== 'idle' ? (
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-coral flex flex-col items-center justify-center text-coral">
                <Loader2 className="h-5 w-5 animate-spin mb-1" />
                <span className="text-[10px] capitalize">{logoStatus}…</span>
              </div>
            ) : logoUrl ? (
              <div className="relative">
                <img src={logoUrl} alt="Business logo" className="w-20 h-20 rounded-2xl object-cover border-2 border-border" />
                <button type="button" onClick={handleRemoveLogo} className="absolute -top-2 -right-2 w-6 h-6 bg-error rounded-full flex items-center justify-center text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label htmlFor="business-logo-input" className="w-20 h-20 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-text-muted hover:border-coral hover:text-coral transition-colors cursor-pointer">
                <Camera className="h-5 w-5 mb-1" />
                <span className="text-xs">Upload</span>
              </label>
            )}
            {/* sr-only keeps the input clickable on iOS Safari, where
                display:none breaks programmatic file-picker triggers. */}
            <input ref={fileInputRef} id="business-logo-input" type="file" accept="image/*,.heic,.heif" onChange={handleLogoSelect} className="sr-only" />
            {logoUrl && logoStatus === 'idle' && (
              <label htmlFor="business-logo-input" className="inline-flex items-center gap-1.5 text-sm font-medium text-coral cursor-pointer hover:underline">
                <Camera className="h-4 w-4" /> Replace logo
              </label>
            )}
            {logoStatus === 'converting' && (
              <p className="text-xs text-text-muted">Converting iPhone photo…</p>
            )}
          </div>
        </div>

        <Input label="Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your business name" maxLength={80} />

        <div>
          <label className="block text-sm font-medium text-text mb-2">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {BUSINESS_CATEGORIES.map((cat) => (
              <button key={cat} type="button" onClick={() => setCategory(cat)} className={cn('px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left', category === cat ? 'border-coral bg-coral/5 text-coral' : 'border-border text-text-muted hover:border-coral/50')}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <TextArea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell people about your business..." rows={3} maxLength={280} showCount />

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Address</label>
          <PlacesAutocomplete
            defaultValue={address}
            placeholder="Search for your address..."
            userLocation={userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null}
            onSelect={(place: PlaceDetails) => setAddress(place.address)}
          />
          {address && (
            <p className="text-xs text-text-muted mt-1">Selected: {address}</p>
          )}
        </div>

        {/* Opening Hours */}
        <div>
          <label className="block text-sm font-medium text-text mb-3">Opening Hours</label>
          <div className="space-y-2">
            {DAYS.map((day) => {
              const dayHours = hours[day];
              const isOpen = !!dayHours;
              return (
                <div key={day} className="flex items-center gap-3 bg-surface rounded-xl p-3 border border-border">
                  <button type="button" onClick={() => toggleDay(day)} className={cn('w-20 text-sm font-medium text-left transition-colors', isOpen ? 'text-coral' : 'text-text-muted')}>
                    {DAY_LABELS[day]}
                  </button>
                  {isOpen ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="time" value={dayHours.open} onChange={(e) => updateDayHours(day, 'open', e.target.value)} className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded-lg text-text" />
                      <span className="text-sm text-text-muted">to</span>
                      <input type="time" value={dayHours.close} onChange={(e) => updateDayHours(day, 'close', e.target.value)} className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded-lg text-text" />
                    </div>
                  ) : (
                    <span className="text-sm text-text-light flex-1">Closed</span>
                  )}
                  <button type="button" onClick={() => toggleDay(day)} className={cn('text-xs font-medium px-2 py-1 rounded-lg transition-colors', isOpen ? 'text-error bg-error/10' : 'text-green-500 bg-green-500/10')}>
                    {isOpen ? 'Close' : 'Open'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <GradientButton fullWidth size="lg" onClick={handleSave} isLoading={isSaving}>
          {isSaving ? <><Loader2 className="h-5 w-5 animate-spin" /> Saving...</> : 'Save Changes'}
        </GradientButton>
      </div>
    </div>
  );
}
