import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, X } from 'lucide-react';
import { Header } from '../components/layout';
import { Input, TextArea, GradientButton, PlacesAutocomplete } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createBusiness, addLocation } from '../services/businessService';
import { compressImage, validateImage } from '../lib/imageCompression';
import { useUserLocation } from '../hooks/useUserLocation';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { BUSINESS_CATEGORIES } from '../types';
import type { PlaceDetails } from '../services/placesService';

type Step = 'basics' | 'details' | 'logo';
const STEPS: Step[] = ['basics', 'details', 'logo'];

export default function CreateBusinessPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { location: userLocation } = useUserLocation();

  const [step, setStep] = useState<Step>('basics');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [addressLat, setAddressLat] = useState(0);
  const [addressLng, setAddressLng] = useState(0);
  const [addressName, setAddressName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentStepIndex = STEPS.indexOf(step);

  const handleBack = () => {
    const prev = currentStepIndex - 1;
    if (prev >= 0) setStep(STEPS[prev]);
    else navigate(-1);
  };

  const handlePlaceSelect = (place: PlaceDetails) => {
    setAddress(place.address);
    setAddressName(place.name);
    setAddressLat(place.lat);
    setAddressLng(place.lng);
  };

  const handleNext = () => {
    if (step === 'basics') {
      if (!name.trim()) { showToast('Please enter a business name', 'error'); return; }
      if (!category) { showToast('Please select a category', 'error'); return; }
      setStep('details');
    } else if (step === 'details') {
      if (!address.trim()) { showToast('Please add your business address', 'error'); return; }
      setStep('logo');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = await validateImage(file);
    if (error) { showToast(error, 'error'); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      let logoUrl: string | undefined;

      if (logoFile) {
        const compressed = await compressImage(logoFile);
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('business-logos')
          .upload(fileName, compressed, { contentType: 'image/jpeg' });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('business-logos').getPublicUrl(fileName);
          logoUrl = urlData.publicUrl;
        }
      }

      const result = await createBusiness(user.id, {
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        logo_url: logoUrl,
      });

      if (result.success && result.data) {
        // Create the first location from the address
        if (address.trim()) {
          await addLocation(result.data.id, {
            name: addressName || 'Main',
            address: address.trim(),
            lat: addressLat,
            lng: addressLng,
            is_primary: true,
          });
        }
        showToast('Business created!', 'success');
        navigate(`/business/${result.data.id}/dashboard`);
      } else {
        showToast(result.error || 'Failed to create business', 'error');
      }
    } catch {
      showToast('An unexpected error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-2xl mx-auto">
      <Header
        showLogo
        leftContent={
          <button onClick={handleBack} className="p-2 -ml-2 rounded-xl text-text-muted hover:text-text hover:bg-gray-100 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
        }
      />

      <div className="p-4">
        {/* Progress */}
        <div className="relative mb-8">
          <div className="h-1.5 bg-border rounded-full" />
          <div
            className="absolute top-0 left-0 h-1.5 gradient-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {step === 'basics' && (
          <div className="space-y-5">
            <h1 className="text-2xl font-bold text-text">Create a business page</h1>
            <p className="text-text-muted">Set up a page for your business to post vouchers and events.</p>

            <Input
              label="Business name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Night Owls Nightclub"
              maxLength={80}
            />

            <div>
              <label className="block text-sm font-medium text-text mb-3">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'p-3 rounded-xl border-2 text-sm font-medium text-left transition-all',
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

            <GradientButton fullWidth onClick={handleNext}>Continue</GradientButton>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-5">
            <h1 className="text-2xl font-bold text-text">Tell people about it</h1>

            <TextArea
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your business do?"
              rows={3}
              maxLength={280}
              showCount
            />

            <div>
              <label className="block text-sm font-medium text-text mb-2">Business address</label>
              <PlacesAutocomplete
                onSelect={handlePlaceSelect}
                defaultValue={address}
                userLocation={userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null}
                placeholder="Search for your business address..."
              />
            </div>

            <GradientButton fullWidth onClick={handleNext}>Continue</GradientButton>
          </div>
        )}

        {step === 'logo' && (
          <div className="space-y-5">
            <h1 className="text-2xl font-bold text-text">Add a logo</h1>
            <p className="text-text-muted">Optional — you can always add one later.</p>

            <div className="flex flex-col items-center gap-4">
              <div className="relative w-32 h-32 rounded-2xl bg-gray-100 overflow-hidden">
                {logoPreview ? (
                  <>
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                      className="absolute top-1 right-1 p-1 bg-black/40 rounded-full text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-full flex flex-col items-center justify-center text-text-muted hover:text-coral transition-colors"
                  >
                    <Camera className="h-8 w-8 mb-1" />
                    <span className="text-xs">Upload</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              {!logoPreview && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-coral font-medium"
                >
                  Choose image
                </button>
              )}
            </div>

            <GradientButton fullWidth onClick={handleSubmit} isLoading={isLoading}>
              Create Business
            </GradientButton>

            {!logoPreview && (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full text-sm text-text-muted hover:text-text transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
