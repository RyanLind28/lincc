import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CheckCircle, ChevronRight, Clock, Download, Globe,
  ImageIcon, Loader2, MapPin, Store, X,
} from 'lucide-react';
import * as Sentry from '@sentry/react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import {
  GradientButton, Input, TextArea, PlacesAutocomplete, UploadErrorNotice, ImagePickerButtons,
} from '../../components/ui';
import { usePWA } from '../../hooks/usePWA';
import { useUserLocation } from '../../hooks/useUserLocation';
import { detectInstallPlatform, getInstallInstructions, InstallSteps } from '../../components/pwa/installInstructions';
import {
  compressImage, validateImageDetailed, convertHeicIfNeeded, autoCropSquareToBlob,
} from '../../lib/imageCompression';
import { updateBusiness } from '../../services/businessService';
import { GuidelinesIntro } from '../../components/onboarding/GuidelinesIntro';
import { OnboardingHelpButton } from '../../components/onboarding/OnboardingHelpButton';
import type { PlaceDetails } from '../../services/placesService';
import type { BusinessOpeningHours } from '../../types';

const LOGO_URL = 'https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp';

const TOTAL_STEPS = 4;

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
type Day = typeof DAYS[number];
const DAY_LABEL: Record<Day, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

const DEFAULT_OPEN = '09:00';
const DEFAULT_CLOSE = '17:00';

// Open 7 days a week, 9–5. We default to "open" rather than "closed" because
// most business owners only want to mark exceptions, not declare every day.
function allOpenWeek(open = DEFAULT_OPEN, close = DEFAULT_CLOSE): BusinessOpeningHours {
  return DAYS.reduce<BusinessOpeningHours>((acc, day) => {
    acc[day] = { open, close };
    return acc;
  }, {});
}

// True iff every day is open AND every day shares the same open/close pair.
function isUniformWeek(hours: BusinessOpeningHours): boolean {
  const first = hours[DAYS[0]];
  if (!first) return false;
  return DAYS.every((day) => {
    const h = hours[day];
    return h && h.open === first.open && h.close === first.close;
  });
}

type LogoStatus = 'idle' | 'converting' | 'compressing' | 'uploading';

export default function BusinessOnboardingPage() {
  const navigate = useNavigate();
  const { user, profile, business, refreshProfile, refreshBusiness } = useAuth();
  const { showToast } = useToast();
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const { location: userLocation } = useUserLocation();

  const [step, setStep] = useState(1);
  const [guidelinesAcknowledged, setGuidelinesAcknowledged] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Step 2 — logo + description
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoStatus, setLogoStatus] = useState<LogoStatus>('idle');
  const [logoError, setLogoError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Step 3 — location + hours + website. Hours default to all 7 days open 9–5
  // and the "same every day" mode is on; the user toggles to per-day editing
  // only if they actually have different hours.
  const [address, setAddress] = useState('');
  const [hours, setHours] = useState<BusinessOpeningHours>(() => allOpenWeek());
  const [sameEveryDay, setSameEveryDay] = useState(true);
  const [website, setWebsite] = useState('');

  // Prefill from existing business record
  useEffect(() => {
    if (!business) return;
    if (business.logo_url) setLogoUrl(business.logo_url);
    if (business.description) setDescription(business.description);
    if (business.address) setAddress(business.address);
    if (business.opening_hours && Object.keys(business.opening_hours).length > 0) {
      setHours(business.opening_hours);
      setSameEveryDay(isUniformWeek(business.opening_hours));
    }
    if (business.social_links?.website) setWebsite(business.social_links.website);
  }, [business]);

  // Resume the wizard after interruption (mobile backgrounding the PWA wipes
  // in-memory state). Scope storage per user.
  const resumeKey = user?.id ? `lincc-business-onboarding:${user.id}` : null;
  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (!resumeKey || hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    try {
      const raw = localStorage.getItem(resumeKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<{
        step: number;
        description: string;
        address: string;
        website: string;
        hours: BusinessOpeningHours;
      }>;
      // Resuming mid-flow means they've already seen the guidelines intro.
      if (saved.step && saved.step > 1 && saved.step <= TOTAL_STEPS) {
        setStep(saved.step);
        setGuidelinesAcknowledged(true);
      }
      if (saved.description) setDescription(saved.description);
      if (saved.address) setAddress(saved.address);
      if (saved.website) setWebsite(saved.website);
      if (saved.hours) setHours(saved.hours);
    } catch {
      // Corrupt resume data — ignore and start fresh
    }
  }, [resumeKey]);
  useEffect(() => {
    if (!resumeKey) return;
    try {
      localStorage.setItem(resumeKey, JSON.stringify({ step, description, address, website, hours }));
    } catch {
      // Quota exceeded — non-fatal
    }
  }, [resumeKey, step, description, address, website, hours]);

  // Wrong account type → bounce home. Personal accounts shouldn't see this.
  if (profile && profile.account_type !== 'business') {
    return <Navigate to="/" replace />;
  }

  // Already finished the wizard → skip straight to the dashboard. The
  // standalone /business/verify, /business/edit and dashboard routes cover
  // anything they want to revisit. Use ?preview=true to walk it again for QA.
  const previewParam = new URLSearchParams(window.location.search).get('preview') === 'true';
  if (profile?.business_onboarding_completed_at && !previewParam) {
    return <Navigate to="/business/dashboard" replace />;
  }

  if (!profile || !business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-coral animate-spin" />
      </div>
    );
  }

  // Show the business guidelines once, up front, before the setup wizard.
  if (!guidelinesAcknowledged) {
    return <GuidelinesIntro variant="business" onContinue={() => setGuidelinesAcknowledged(true)} />;
  }

  // ---- Step 3 logo handlers ----

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    const validation = await validateImageDetailed(file);
    if (logoInputRef.current) logoInputRef.current.value = '';
    if (!validation.ok) {
      Sentry.captureMessage('business-onboarding-logo: validation rejected file', {
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
      setLogoError(validation.error);
      return;
    }
    if (validation.recovered) {
      Sentry.captureMessage('business-onboarding-logo: recovered unreadable file', {
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
    let workingFile = validation.file;
    if (validation.format === 'heic') {
      setLogoStatus('converting');
      try {
        workingFile = await convertHeicIfNeeded(workingFile, 'heic');
      } catch (err) {
        Sentry.captureException(err, { tags: { feature: 'business-onboarding-logo', stage: 'heic-convert' } });
        showToast("Couldn't convert this iPhone photo. Try a JPEG instead.", 'error');
        setLogoStatus('idle');
        return;
      }
    }
    // Auto center-crop to a square — the interactive cropper pop-up failed to
    // render on mobile, so we crop on canvas directly (logos display square).
    let squareBlob: Blob;
    try {
      squareBlob = await autoCropSquareToBlob(workingFile);
    } catch (err) {
      Sentry.captureException(err, { tags: { feature: 'business-onboarding-logo', stage: 'autocrop' } });
      showToast("Couldn't process that image. Try another one.", 'error');
      setLogoStatus('idle');
      return;
    }
    setLogoStatus('idle');
    const logoFileObj = new File([squareBlob], `logo-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setLogoFile(logoFileObj);
    setLogoUrl(URL.createObjectURL(squareBlob));
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoUrl(null);
  };

  // ---- Step 4 hours handlers ----

  // "Same every day" mode: editing one pair fans out to all 7 days. When the
  // user switches into per-day, we keep whatever the bulk values were as the
  // starting point so they can tweak from there.
  const bulkHours = hours[DAYS[0]] ?? { open: DEFAULT_OPEN, close: DEFAULT_CLOSE };

  const updateBulkHours = (field: 'open' | 'close', value: string) => {
    setHours(allOpenWeek(
      field === 'open' ? value : bulkHours.open,
      field === 'close' ? value : bulkHours.close,
    ));
  };

  const updateDayHours = (day: Day, field: 'open' | 'close', value: string) => {
    const current = hours[day];
    if (!current) return;
    setHours({ ...hours, [day]: { ...current, [field]: value } });
  };

  const setDayClosed = (day: Day) => {
    const updated = { ...hours };
    delete updated[day];
    setHours(updated);
  };

  const setDayOpen = (day: Day) => {
    setHours({ ...hours, [day]: { open: bulkHours.open, close: bulkHours.close } });
  };

  // ---- Finish ----

  const uploadLogoIfNeeded = async (): Promise<string | null> => {
    if (!logoFile || !business.owner_id) return logoUrl;
    setLogoStatus('compressing');
    let compressed: Blob;
    try {
      compressed = await compressImage(logoFile);
    } catch (err) {
      Sentry.captureException(err, { tags: { feature: 'business-onboarding-logo', stage: 'compress' } });
      throw new Error("Couldn't process your logo. Try a different image.");
    }
    setLogoStatus('uploading');
    const fileName = `${business.owner_id}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('business-logos')
      .upload(fileName, compressed, { contentType: 'image/jpeg' });
    if (uploadError) {
      Sentry.captureException(uploadError, { tags: { feature: 'business-onboarding-logo', stage: 'upload' } });
      throw new Error(uploadError.message || 'Logo upload failed');
    }
    const { data } = supabase.storage.from('business-logos').getPublicUrl(fileName);
    setLogoStatus('idle');
    return data.publicUrl;
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      const finalLogoUrl = await uploadLogoIfNeeded();

      // Save business details (logo, bio, address, hours, website)
      const trimmedWebsite = website.trim();
      const socialLinks = trimmedWebsite ? { ...(business.social_links ?? {}), website: trimmedWebsite } : business.social_links;
      const result = await updateBusiness(business.id, {
        logo_url: finalLogoUrl,
        description: description.trim() || null,
        address: address.trim() || null,
        opening_hours: Object.keys(hours).length > 0 ? hours : null,
        social_links: socialLinks ?? null,
      });
      if (!result.success) {
        throw new Error(result.error || 'Failed to save business profile');
      }

      // Mark onboarding done. The gate in checkProfileComplete reads this.
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ business_onboarding_completed_at: new Date().toISOString() })
        .eq('id', profile.id);
      if (profileErr) throw new Error(profileErr.message);

      // Clear resume state
      if (resumeKey) {
        try { localStorage.removeItem(resumeKey); } catch { /* ignore */ }
      }

      await Promise.all([refreshProfile(), refreshBusiness()]);
      showToast("You're all set", 'success');
      navigate('/business/dashboard', { replace: true });
    } catch (err) {
      Sentry.captureException(err, { tags: { feature: 'business-onboarding', stage: 'finish' } });
      showToast(err instanceof Error ? err.message : 'Something went wrong', 'error');
    } finally {
      setIsFinishing(false);
      setLogoStatus('idle');
    }
  };

  // ---- Navigation helpers ----

  // Each substantive step gates its Next button on the inputs it owns. Welcome
  // and Install (1 and 4) are non-blocking — Install is optional by design and
  // Welcome has no inputs. Hours and website are optional polish on step 3.
  const hasDescription = description.trim().length > 0;
  const hasAddress = address.trim().length > 0;

  // Logo is optional — a broken image upload must never block onboarding. The
  // business can add or change it later from the dashboard. Only the
  // description gates step 2.
  const canAdvance = (() => {
    if (step === 2) return hasDescription;
    if (step === 3) return hasAddress;
    return true;
  })();

  const advanceHint = (() => {
    if (step === 2 && !hasDescription) return 'Add a short description to continue.';
    if (step === 3 && !hasAddress) return 'Add your address to continue.';
    return null;
  })();

  const goNext = () => {
    if (step >= TOTAL_STEPS) {
      handleFinish();
      return;
    }
    setStep(step + 1);
  };
  const goBack = () => { if (step > 1) setStep(step - 1); };

  const installPlatform = detectInstallPlatform();
  const installInstructions = getInstallInstructions(installPlatform);

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <div className="px-4 pt-4 pb-2 safe-top">
        <div className="flex items-center justify-between gap-3 mb-3">
          <img src={LOGO_URL} alt="Lincc" className="h-7" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Step {step} of {TOTAL_STEPS}</span>
            <OnboardingHelpButton source={`business-onboarding-step-${step}`} />
          </div>
        </div>
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full gradient-primary transition-all"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full">
        {step === 1 && (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl gradient-primary mx-auto flex items-center justify-center">
              <Store className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Welcome to Lincc for Business</h1>
              <p className="text-sm text-text-muted mt-2">
                A quick setup so {business.name} is ready to post deals, vouchers and openings to people nearby.
              </p>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-4 text-left space-y-2.5">
              <p className="text-sm font-semibold text-text">What you'll need</p>
              <ul className="text-sm text-text-muted space-y-2">
                <li className="flex items-start gap-2"><ImageIcon className="h-4 w-4 text-coral mt-0.5 flex-shrink-0" /> Your logo (square image)</li>
                <li className="flex items-start gap-2"><MapPin className="h-4 w-4 text-coral mt-0.5 flex-shrink-0" /> Your address and opening hours</li>
              </ul>
              <p className="text-xs text-text-light pt-1">Takes about 2 minutes. You can verify your business later for the official tick.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ImageIcon className="h-5 w-5 text-coral" />
                <h1 className="text-xl font-bold text-text">Logo & description</h1>
              </div>
              <p className="text-sm text-text-muted">A square logo and a one-line description help guests recognise you.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Business logo</label>
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
                {logoStatus !== 'idle' ? (
                  <div className="w-20 h-20 shrink-0 rounded-2xl border-2 border-dashed border-coral flex flex-col items-center justify-center text-coral">
                    <Loader2 className="h-5 w-5 animate-spin mb-1" />
                    <span className="text-[10px] capitalize">{logoStatus}…</span>
                  </div>
                ) : logoUrl ? (
                  <div className="relative shrink-0">
                    <img src={logoUrl} alt="Business logo" className="w-20 h-20 rounded-2xl object-cover border-2 border-border" />
                    <button type="button" onClick={handleRemoveLogo} className="absolute -top-2 -right-2 w-6 h-6 bg-error rounded-full flex items-center justify-center text-white" aria-label="Remove logo">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="business-onboarding-logo-input" className="w-20 h-20 shrink-0 rounded-2xl border-2 border-dashed border-border flex items-center justify-center text-text-muted hover:border-coral hover:text-coral cursor-pointer transition-colors">
                    <ImageIcon className="h-6 w-6" />
                  </label>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text">
                    {logoUrl ? 'Looking good' : 'Add your logo'}
                  </p>
                  <p className="text-xs text-text-muted mb-3">Square image works best. PNG or JPG.</p>
                  {/* Hidden input kept so the UploadErrorNotice retry below can
                      re-open the gallery picker via the ref. The two buttons use
                      their own label-wrapped inputs (reliable on Samsung). */}
                  <input
                    ref={logoInputRef}
                    id="business-onboarding-logo-input"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    className="sr-only"
                  />
                  <ImagePickerButtons
                    onCameraSelect={handleLogoSelect}
                    galleryLabel={logoUrl ? 'Change logo' : 'Choose logo'}
                    cameraLabel="Take a photo"
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {logoError && (
              <UploadErrorNotice
                message={logoError}
                onRetry={() => { setLogoError(null); logoInputRef.current?.click(); }}
                onSkip={() => setLogoError(null)}
                skipLabel="Skip logo"
                reportSource="business-logo"
              />
            )}

            <TextArea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              placeholder="What does your business offer? Keep it short."
              rows={3}
              maxLength={200}
              showCount
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-5 w-5 text-coral" />
                <h1 className="text-xl font-bold text-text">Location & hours</h1>
              </div>
              <p className="text-sm text-text-muted">Help nearby people find you and know when you're open.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Address</label>
              <PlacesAutocomplete
                defaultValue={address}
                userLocation={userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null}
                onSelect={(place: PlaceDetails) => setAddress(place.address || place.name || '')}
                placeholder="Start typing your address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5 flex items-center gap-1.5">
                <Globe className="h-4 w-4" /> Website (optional)
              </label>
              <Input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://your-business.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2 flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Opening hours
              </label>

              {/* Mode picker — segmented control. Most businesses keep the same
                  hours every day, so we lead with that to avoid making them
                  fill seven rows by hand. */}
              <div className="inline-flex p-1 bg-surface border border-border rounded-xl mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setSameEveryDay(true);
                    setHours(allOpenWeek(bulkHours.open, bulkHours.close));
                  }}
                  className={cn(
                    'px-3 h-8 text-xs font-medium rounded-lg transition-colors',
                    sameEveryDay ? 'bg-coral text-white' : 'text-text-muted hover:text-text'
                  )}
                >
                  Same every day
                </button>
                <button
                  type="button"
                  onClick={() => setSameEveryDay(false)}
                  className={cn(
                    'px-3 h-8 text-xs font-medium rounded-lg transition-colors',
                    !sameEveryDay ? 'bg-coral text-white' : 'text-text-muted hover:text-text'
                  )}
                >
                  Different each day
                </button>
              </div>

              {sameEveryDay ? (
                <div className="flex items-center gap-2 px-3 py-3 rounded-xl border border-coral/40 bg-coral/5">
                  <span className="text-sm font-medium text-text w-16">Mon–Sun</span>
                  <input
                    type="time"
                    value={bulkHours.open}
                    onChange={(e) => updateBulkHours('open', e.target.value)}
                    className="flex-1 h-9 px-2 text-sm rounded-lg border border-border bg-background"
                  />
                  <span className="text-text-muted text-xs">–</span>
                  <input
                    type="time"
                    value={bulkHours.close}
                    onChange={(e) => updateBulkHours('close', e.target.value)}
                    className="flex-1 h-9 px-2 text-sm rounded-lg border border-border bg-background"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  {DAYS.map((day) => {
                    const dayHours = hours[day];
                    const open = !!dayHours;
                    return (
                      <div key={day} className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-xl border',
                        open ? 'border-coral/40 bg-coral/5' : 'border-border bg-surface'
                      )}>
                        <span className="w-12 text-sm font-medium text-text">
                          {DAY_LABEL[day]}
                        </span>
                        {open && dayHours ? (
                          <>
                            <input
                              type="time"
                              value={dayHours.open}
                              onChange={(e) => updateDayHours(day, 'open', e.target.value)}
                              className="flex-1 h-8 px-2 text-sm rounded-lg border border-border bg-background"
                            />
                            <span className="text-text-muted text-xs">–</span>
                            <input
                              type="time"
                              value={dayHours.close}
                              onChange={(e) => updateDayHours(day, 'close', e.target.value)}
                              className="flex-1 h-8 px-2 text-sm rounded-lg border border-border bg-background"
                            />
                            <button
                              type="button"
                              onClick={() => setDayClosed(day)}
                              className="text-xs text-text-muted hover:text-error px-1.5"
                              aria-label={`Mark ${DAY_LABEL[day]} closed`}
                            >
                              Close
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-xs text-text-muted">Closed</span>
                            <button
                              type="button"
                              onClick={() => setDayOpen(day)}
                              className="text-xs font-medium text-coral hover:underline px-1.5"
                            >
                              Open
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Download className="h-5 w-5 text-coral" />
                <h1 className="text-xl font-bold text-text">Add Lincc to your home screen</h1>
              </div>
              <p className="text-sm text-text-muted">
                Get a one-tap shortcut, push notifications for new join requests, and an app-like experience.
              </p>
            </div>

            {isInstalled ? (
              <div className="bg-success/10 border border-success/30 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-success">Already installed</p>
                  <p className="text-xs text-text-muted">You're using Lincc as an app.</p>
                </div>
              </div>
            ) : isInstallable ? (
              <button
                type="button"
                onClick={async () => {
                  const accepted = await promptInstall();
                  if (!accepted) showToast('Install dismissed. You can do this later from the home screen.', 'info');
                }}
                className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border border-coral bg-coral/5 hover:bg-coral/10 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-coral" />
                  <span className="text-sm font-semibold text-text">Install Lincc</span>
                </span>
                <ChevronRight className="h-5 w-5 text-coral" />
              </button>
            ) : (
              <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                <p className="text-sm font-medium text-text">{installInstructions?.tagline ?? 'Add it manually from your browser'}</p>
                {installInstructions && <InstallSteps steps={installInstructions.steps} />}
              </div>
            )}

            <p className="text-xs text-text-light">You can skip this and install later — Lincc works fine in your browser too.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-surface/80 backdrop-blur safe-bottom">
        <div className="max-w-md mx-auto w-full px-4 py-3 space-y-2">
          {advanceHint && (
            <p className="text-xs text-text-muted text-center">{advanceHint}</p>
          )}
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                disabled={isFinishing}
                className="inline-flex items-center gap-1 px-3 h-11 text-sm font-medium text-text-muted hover:text-text disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
            <div className="flex-1" />
            <GradientButton
              onClick={goNext}
              isLoading={isFinishing}
              disabled={!canAdvance}
            >
              {step === TOTAL_STEPS ? "I'm done" : 'Next'}
              {step !== TOTAL_STEPS && <ArrowRight className="h-4 w-4 ml-1" />}
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  );
}
