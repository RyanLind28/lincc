import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Header } from '../components/layout';
import { Input, TextArea, GradientButton, PlacesAutocomplete } from '../components/ui';
import type { PlaceDetails } from '../services/placesService';
import { useUserLocation } from '../hooks/useUserLocation';
import { Camera, X, Loader2, AlertTriangle } from 'lucide-react';
import { updateBusiness } from '../services/businessService';
import { supabase } from '../lib/supabase';
import { compressImage, validateImage } from '../lib/imageCompression';
import { BUSINESS_CATEGORIES } from '../types';
import { cn } from '../lib/utils';
import type { BusinessOpeningHours } from '../types';

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
  const [hours, setHours] = useState<BusinessOpeningHours>({});
  const [isSaving, setIsSaving] = useState(false);

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
    if (!file) return;
    const error = await validateImage(file);
    if (error) { showToast(error, 'error'); return; }
    setLogoFile(file);
    setLogoUrl(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        const compressed = await compressImage(logoFile);
        const fileName = `${business.owner_id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('business-logos')
          .upload(fileName, compressed, { contentType: 'image/jpeg' });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('business-logos').getPublicUrl(fileName);
          uploadedLogoUrl = urlData.publicUrl;
        } else {
          showToast('Failed to upload logo', 'error');
        }
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
        showToast(result.error || 'Failed to update', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header showBack showLogo />

      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold text-text">Edit Business</h1>

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">Business Logo</label>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <div className="relative">
                <img src={logoUrl} alt="Business logo" className="w-20 h-20 rounded-2xl object-cover border-2 border-border" />
                <button type="button" onClick={handleRemoveLogo} className="absolute -top-2 -right-2 w-6 h-6 bg-error rounded-full flex items-center justify-center text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-text-muted hover:border-coral hover:text-coral transition-colors">
                <Camera className="h-5 w-5 mb-1" />
                <span className="text-xs">Upload</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
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
