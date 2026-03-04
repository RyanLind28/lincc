import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Calendar, Users, Clock, Search, Sparkles, HelpCircle, Camera, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout';
import { Input, TextArea, GradientButton, Slider, DatePicker, CategoryIcon, PlacesAutocomplete } from '../components/ui';
import { CATEGORIES, type Category, type SubCategory } from '../data/categories';
import { createEvent } from '../services/events';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { compressImage, validateImageSize } from '../lib/imageCompression';
import { useUserLocation } from '../hooks/useUserLocation';
import { getPlacePhotoUrl, type PlaceDetails } from '../services/placesService';
import type { JoinMode, Audience } from '../types';

type Step = 'category' | 'subcategory' | 'details' | 'when' | 'guests';

const STEPS: Step[] = ['category', 'subcategory', 'details', 'when', 'guests'];

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, profile } = useAuth();
  const { location: userLocation } = useUserLocation();

  const [step, setStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<SubCategory | null>(null);
  const [customSubcategory, setCustomSubcategory] = useState('');
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [subcategorySearch, setSubcategorySearch] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueLat, setVenueLat] = useState<number>(0);
  const [venueLng, setVenueLng] = useState<number>(0);
  const [venuePlaceId, setVenuePlaceId] = useState<string | null>(null);
  const [venuePhotos, setVenuePhotos] = useState<{ name: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [capacity, setCapacity] = useState(4);
  const [joinMode, setJoinMode] = useState<JoinMode>('request');
  const [audience, setAudience] = useState<Audience>('everyone');
  const [isLoading, setIsLoading] = useState(false);

  // Cover image state
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Date constraints - up to 1 month in the future
  const now = new Date();
  const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const currentStepIndex = STEPS.indexOf(step);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setCustomSubcategory('');
    setCustomCategoryText('');
    setSubcategorySearch('');
    setStep('subcategory');
  };

  const handleSubcategorySelect = (subcategory: SubCategory | null, custom?: string) => {
    if (custom) {
      setSelectedSubcategory(null);
      setCustomSubcategory(custom);
    } else {
      setSelectedSubcategory(subcategory);
      setCustomSubcategory('');
    }
    // Auto-populate cover image from subcategory or category
    const defaultImage = subcategory?.image ?? selectedCategory?.image ?? null;
    setCoverImageUrl(defaultImage);
    setCoverImageFile(null);
    setStep('details');
  };

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
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCoverImageReset = () => {
    setCoverImageFile(null);
    const defaultImage = selectedSubcategory?.image ?? selectedCategory?.image ?? null;
    setCoverImageUrl(defaultImage);
  };

  const handlePlaceSelect = (place: PlaceDetails) => {
    setVenueName(place.name);
    setVenueAddress(place.address);
    setVenueLat(place.lat);
    setVenueLng(place.lng);
    setVenuePlaceId(place.id);
    setVenuePhotos(place.photos || []);

    // If user hasn't uploaded a custom cover image, offer venue photo as cover
    if (!coverImageFile && place.photos.length > 0) {
      const photoUrl = getPlacePhotoUrl(place.photos[0].name, 800, 600);
      setCoverImageUrl(photoUrl);
    }
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
      case 'details':
        if (!title.trim()) {
          showToast('Please enter a title', 'error');
          return;
        }
        if (!venueName.trim()) {
          showToast('Please enter a venue', 'error');
          return;
        }
        setStep('when');
        break;
      case 'when':
        if (!selectedDate) {
          showToast('Please select a date', 'error');
          return;
        }
        setStep('guests');
        break;
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      showToast('Please log in to create an event', 'error');
      return;
    }

    if (!selectedCategory) {
      showToast('Please select a category', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Combine date and time
      const eventDateTime = new Date(selectedDate!);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      eventDateTime.setHours(hours, minutes, 0, 0);

      // Upload cover image if user selected a file
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
            showToast('Failed to upload image, using default', 'error');
          } else {
            const { data: urlData } = supabase.storage
              .from('event-images')
              .getPublicUrl(fileName);
            finalCoverImageUrl = urlData.publicUrl;
          }
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          showToast('Failed to upload image, using default', 'error');
        } finally {
          setIsUploading(false);
        }
      }

      const result = await createEvent(
        {
          category_name: selectedCategory.label,
          title: title.trim(),
          description: description.trim() || undefined,
          custom_category: selectedCategory.value === 'other' ? customCategoryText.trim() : undefined,
          venue_name: venueName.trim(),
          venue_address: venueAddress.trim() || venueName.trim(),
          venue_lat: venueLat || undefined,
          venue_lng: venueLng || undefined,
          venue_place_id: venuePlaceId || undefined,
          start_time: eventDateTime.toISOString(),
          capacity,
          join_mode: joinMode,
          audience,
          cover_image_url: finalCoverImageUrl || undefined,
        },
        user.id
      );

      if (result.success && result.data) {
        showToast('Event created successfully!', 'success');
        navigate(`/event/${result.data.id}`);
      } else {
        showToast(result.error || 'Failed to create event', 'error');
      }
    } catch (err) {
      console.error('Error creating event:', err);
      showToast('An unexpected error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter subcategories based on search
  const filteredSubcategories = selectedCategory?.subcategories.filter((sub) =>
    sub.label.toLowerCase().includes(subcategorySearch.toLowerCase())
  ) || [];

  // Check if search matches any subcategory
  const exactMatch = filteredSubcategories.some(
    (sub) => sub.label.toLowerCase() === subcategorySearch.toLowerCase()
  );

  // Format time for display
  const formatTimeDisplay = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const hour = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const getStepTitle = () => {
    switch (step) {
      case 'category':
        return 'What type of activity?';
      case 'subcategory':
        return selectedCategory?.label || 'Choose type';
      case 'details':
        return 'Event details';
      case 'when':
        return 'When is it?';
      case 'guests':
        return 'Final details';
    }
  };

  const getSubcategoryDisplay = () => {
    if (selectedCategory?.value === 'other' && customCategoryText) return customCategoryText;
    if (customSubcategory) return customSubcategory;
    if (selectedSubcategory) return selectedSubcategory.label;
    return '';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        showBack={step === 'category'}
        showLogo
        leftContent={
          step !== 'category' ? (
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
        {/* Progress bar - gradient design */}
        <div className="relative mb-8">
          {/* Background track */}
          <div className="h-1.5 bg-border rounded-full" />
          {/* Filled track - gradient */}
          <div
            className="absolute top-0 left-0 h-1.5 gradient-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
          />
          {/* Step dots */}
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

        {/* Step content */}
        {step === 'category' && (
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((category) => (
              <button
                key={category.value}
                onClick={() => handleCategorySelect(category)}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden group"
              >
                <img
                  src={category.image}
                  alt={category.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-2">
                    <CategoryIcon icon={category.icon} size="lg" className="text-white" />
                    <span className="text-white font-semibold">{category.label}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 'subcategory' && selectedCategory && (
          selectedCategory.value === 'other' ? (
            /* "Other" category — free-text input */
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-purple/10 rounded-xl">
                <HelpCircle className="h-6 w-6 text-purple flex-shrink-0" />
                <p className="text-sm text-text-muted">
                  Tell us what type of event this is so we can improve our categories.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  What type of event is this?
                </label>
                <input
                  type="text"
                  value={customCategoryText}
                  onChange={(e) => setCustomCategoryText(e.target.value)}
                  placeholder='e.g., "Volunteering", "Car meetup", "Language exchange"'
                  maxLength={60}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral"
                />
              </div>
              <GradientButton
                fullWidth
                onClick={() => {
                  if (!customCategoryText.trim()) {
                    showToast('Please describe the event type', 'error');
                    return;
                  }
                  setCustomSubcategory(customCategoryText.trim());
                  setCoverImageUrl(selectedCategory?.image ?? null);
                  setCoverImageFile(null);
                  setStep('details');
                }}
              >
                Continue
              </GradientButton>
            </div>
          ) : (
            /* Normal subcategory selection */
            <div className="space-y-4">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                <input
                  type="text"
                  value={subcategorySearch}
                  onChange={(e) => setSubcategorySearch(e.target.value)}
                  placeholder={`Search or type custom (e.g., "Hyrox")`}
                  className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral"
                />
              </div>

              {/* Subcategory list */}
              <div className="space-y-2">
                {filteredSubcategories.map((sub) => (
                  <button
                    key={sub.value}
                    onClick={() => handleSubcategorySelect(sub)}
                    className="w-full flex items-center justify-between p-4 bg-surface rounded-xl border border-border hover:border-coral transition-colors group"
                  >
                    <span className="font-medium text-text group-hover:text-coral transition-colors">
                      {sub.label}
                    </span>
                    <ChevronRight className="h-5 w-5 text-text-light group-hover:text-coral transition-colors" />
                  </button>
                ))}

                {/* Custom option - shown when searching and no exact match */}
                {subcategorySearch.trim() && !exactMatch && (
                  <button
                    onClick={() => handleSubcategorySelect(null, subcategorySearch.trim())}
                    className="w-full flex items-center justify-between p-4 bg-coral/10 rounded-xl border border-coral/30 hover:border-coral transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-coral" />
                      <span className="font-medium text-coral">
                        "{subcategorySearch.trim()}"
                      </span>
                      <span className="text-sm text-text-muted">(custom)</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-coral" />
                  </button>
                )}
              </div>

              {/* Hint */}
              <p className="text-xs text-text-muted text-center mt-4">
                Can't find what you're looking for? Just type it above!
              </p>
            </div>
          )
        )}

        {step === 'details' && (
          <div className="space-y-5">
            {/* Selected category preview */}
            <div className="flex items-center gap-3 p-3 bg-coral/10 rounded-xl">
              {selectedCategory && <CategoryIcon icon={selectedCategory.icon} size="lg" className="text-coral" />}
              <div>
                <p className="font-medium text-text">{selectedCategory?.label}</p>
                <p className="text-sm text-coral flex items-center gap-1">
                  {customSubcategory && <Sparkles className="h-3 w-3" />}
                  {getSubcategoryDisplay()}
                </p>
              </div>
            </div>

            {/* Cover image picker */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">Cover image</label>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                {coverImageUrl ? (
                  <img
                    src={coverImageUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full gradient-primary flex items-center justify-center">
                    <CategoryIcon icon={selectedCategory?.icon || 'Calendar'} size="xl" className="text-white" />
                  </div>
                )}
                {/* Overlay buttons */}
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-colors"
                    aria-label="Upload cover image"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  {coverImageFile && (
                    <button
                      type="button"
                      onClick={handleCoverImageReset}
                      className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-colors"
                      aria-label="Reset to default image"
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
              <p className="text-xs text-text-muted mt-1">
                Tap the camera to upload your own photo
              </p>
            </div>

            <Input
              label="Event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give it a catchy name..."
              maxLength={60}
            />

            <TextArea
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What should people know about this event?"
              rows={3}
              maxLength={280}
              showCount
            />

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                <MapPin className="inline h-4 w-4 mr-1 text-coral" />
                Where is it?
              </label>
              <PlacesAutocomplete
                onSelect={handlePlaceSelect}
                defaultValue={venueName}
                userLocation={userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null}
                placeholder="Search for a venue..."
              />

              {/* Venue photo picker — only when venue has Google photos */}
              {venuePhotos.length > 1 && !coverImageFile && (
                <div className="mt-3">
                  <p className="text-xs text-text-muted mb-2">Venue photos — tap to use as cover</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {venuePhotos.map((photo, i) => {
                      const url = getPlacePhotoUrl(photo.name, 200, 150);
                      return (
                        <button
                          key={photo.name}
                          type="button"
                          onClick={() => setCoverImageUrl(getPlacePhotoUrl(photo.name, 800, 600))}
                          className={cn(
                            'flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all',
                            coverImageUrl?.includes(photo.name)
                              ? 'border-coral ring-2 ring-coral/30'
                              : 'border-border hover:border-coral/50'
                          )}
                        >
                          <img
                            src={url}
                            alt={`Venue photo ${i + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <GradientButton fullWidth onClick={handleNext}>
              Continue
            </GradientButton>
          </div>
        )}

        {step === 'when' && (
          <div className="space-y-6">
            {/* Date picker */}
            <div>
              <label className="block text-sm font-medium text-text mb-3">
                <Calendar className="inline h-4 w-4 mr-1 text-coral" />
                Select a date
              </label>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                maxDate={maxDate}
                className="border border-border"
              />
            </div>

            {/* Time picker - simple input */}
            <div>
              <label className="block text-sm font-medium text-text mb-3">
                <Clock className="inline h-4 w-4 mr-1 text-coral" />
                What time?
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="flex-1 px-4 py-3 bg-surface border border-border rounded-xl text-text text-lg font-medium focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral"
                />
                <div className="px-4 py-3 bg-coral/10 rounded-xl">
                  <span className="text-coral font-semibold">{formatTimeDisplay(selectedTime)}</span>
                </div>
              </div>
            </div>

            <GradientButton fullWidth onClick={handleNext}>
              Continue
            </GradientButton>
          </div>
        )}

        {step === 'guests' && (
          <div className="space-y-6">
            {/* Capacity slider */}
            <div>
              <label className="block text-sm font-medium text-text mb-4">
                <Users className="inline h-4 w-4 mr-1 text-coral" />
                How many guests can join?
              </label>
              <Slider
                value={capacity}
                onChange={setCapacity}
                min={1}
                max={15}
                step={1}
                formatValue={(v) => `${v} ${v === 1 ? 'guest' : 'guests'}`}
              />
              <div className="flex justify-between text-xs text-text-muted mt-2">
                <span>Intimate</span>
                <span>Group</span>
              </div>
            </div>

            {/* Join mode */}
            <div>
              <label className="block text-sm font-medium text-text mb-3">
                How do people join?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setJoinMode('request')}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-left',
                    joinMode === 'request'
                      ? 'border-coral bg-coral/5'
                      : 'border-border hover:border-coral/50'
                  )}
                >
                  <p className="font-semibold text-text mb-1">Request</p>
                  <p className="text-xs text-text-muted">You approve each person</p>
                </button>
                <button
                  onClick={() => setJoinMode('auto')}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-left',
                    joinMode === 'auto'
                      ? 'border-coral bg-coral/5'
                      : 'border-border hover:border-coral/50'
                  )}
                >
                  <p className="font-semibold text-text mb-1">Open</p>
                  <p className="text-xs text-text-muted">Anyone can join instantly</p>
                </button>
              </div>
            </div>

            {/* Audience - Only women can create women-only events */}
            {profile?.gender === 'female' && (
              <div>
                <label className="block text-sm font-medium text-text mb-3">
                  Who can see this event?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAudience('everyone')}
                    className={cn(
                      'p-3 rounded-xl border-2 transition-all text-center',
                      audience === 'everyone'
                        ? 'border-coral bg-coral/5'
                        : 'border-border hover:border-coral/50'
                    )}
                  >
                    <p className="font-medium text-text text-sm">Everyone</p>
                  </button>
                  <button
                    onClick={() => setAudience('women')}
                    className={cn(
                      'p-3 rounded-xl border-2 transition-all text-center',
                      audience === 'women'
                        ? 'border-coral bg-coral/5'
                        : 'border-border hover:border-coral/50'
                    )}
                  >
                    <p className="font-medium text-text text-sm">Women Only</p>
                  </button>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <h3 className="font-semibold text-text">Event Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Category</span>
                  <span className="text-text flex items-center gap-1">
                    {selectedCategory && <CategoryIcon icon={selectedCategory.icon} size="sm" className="text-coral" />}
                    {customSubcategory && <Sparkles className="h-3 w-3 text-coral" />}
                    {getSubcategoryDisplay()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Title</span>
                  <span className="text-text truncate ml-4">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Where</span>
                  <span className="text-text truncate ml-4">{venueName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">When</span>
                  <span className="text-text">
                    {selectedDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' at '}
                    {formatTimeDisplay(selectedTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Guests</span>
                  <span className="text-text">{capacity} max</span>
                </div>
                {profile?.gender === 'female' && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Visible to</span>
                    <span className="text-text">{audience === 'women' ? 'Women only' : 'Everyone'}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-muted">Join mode</span>
                  <span className="text-text">{joinMode === 'request' ? 'Request' : 'Open'}</span>
                </div>
              </div>
            </div>

            <GradientButton
              fullWidth
              size="lg"
              onClick={handleSubmit}
              isLoading={isLoading || isUploading}
            >
              {isUploading ? 'Uploading image...' : 'Create Event'}
            </GradientButton>
          </div>
        )}
      </div>
    </div>
  );
}
