import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Ticket, Eye, AlertTriangle, MapPin, X, Calendar } from 'lucide-react';
import { Header } from '../components/layout';
import { GradientButton, Badge, PlacesAutocomplete } from '../components/ui';
import { VoucherTile } from '../components/ui/VoucherTile';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useUserLocation } from '../hooks/useUserLocation';
import { getBusinessById, deleteBusiness, getLocationsByBusiness, addLocation, deleteLocation } from '../services/businessService';
import { getVouchersByBusiness } from '../services/voucherService';
import type { BusinessWithOwner, BusinessLocation, VoucherWithDetails } from '../types';
import type { PlaceDetails } from '../services/placesService';

export default function BusinessDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const { location: userLocation } = useUserLocation();

  const [business, setBusiness] = useState<BusinessWithOwner | null>(null);
  const [vouchers, setVouchers] = useState<VoucherWithDetails[]>([]);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationPlace, setNewLocationPlace] = useState<PlaceDetails | null>(null);
  const [isAddingLocation, setIsAddingLocation] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const biz = await getBusinessById(id);
      setBusiness(biz);

      if (biz) {
        const [v, locs] = await Promise.all([
          getVouchersByBusiness(biz.id),
          getLocationsByBusiness(biz.id),
        ]);
        setVouchers(v);
        setLocations(locs);
      }
      setIsLoading(false);
    };

    load();
  }, [id]);

  const handlePlaceSelect = (place: PlaceDetails) => {
    setNewLocationPlace(place);
    if (!newLocationName) setNewLocationName(place.name);
  };

  const handleSaveLocation = async () => {
    if (!id || !newLocationPlace) {
      showToast('Please search and select an address', 'error');
      return;
    }
    if (!newLocationName.trim()) {
      showToast('Please enter a location name', 'error');
      return;
    }

    setIsAddingLocation(true);
    const result = await addLocation(id, {
      name: newLocationName.trim(),
      address: newLocationPlace.address,
      lat: newLocationPlace.lat,
      lng: newLocationPlace.lng,
    });

    if (result.success && result.data) {
      setLocations((prev) => [...prev, result.data!]);
      setShowAddLocation(false);
      setNewLocationName('');
      setNewLocationPlace(null);
      showToast('Location added', 'success');
    } else {
      showToast(result.error || 'Failed to add location', 'error');
    }
    setIsAddingLocation(false);
  };

  const handleDeleteLocation = async (locationId: string) => {
    const result = await deleteLocation(locationId);
    if (result.success) {
      setLocations((prev) => prev.filter((l) => l.id !== locationId));
      showToast('Location removed', 'info');
    } else {
      showToast(result.error || 'Failed to delete', 'error');
    }
  };

  // Access guard
  if (!isLoading && (!business || business.owner_id !== user?.id)) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack showLogo />
        <div className="flex flex-col items-center justify-center p-8 mt-20">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-error" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Access denied</h2>
          <p className="text-text-muted text-center mb-4">You don't own this business page.</p>
          <GradientButton onClick={() => navigate('/my-businesses')}>My Businesses</GradientButton>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    const result = await deleteBusiness(id);
    if (result.success) {
      showToast('Business deleted', 'info');
      navigate('/my-businesses');
    } else {
      showToast(result.error || 'Failed to delete', 'error');
    }
    setIsDeleting(false);
  };

  const activeVouchers = vouchers.filter((v) => v.status === 'active');
  const totalRedemptions = vouchers.reduce((sum, v) => sum + v.redemption_count, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack showLogo />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface rounded-2xl border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6 max-w-3xl mx-auto">
      <Header showBack showLogo showNotifications />

      <div className="p-4">
        {/* Business header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0">
            {business?.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gradient-primary flex items-center justify-center text-white font-bold text-2xl">
                {business?.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-text truncate">{business?.name}</h1>
            <Badge variant="outline">{business?.category}</Badge>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Link to={`/event/new?business=${id}`}>
            <div className="flex flex-col items-center gap-2 p-4 bg-surface rounded-xl border border-border hover:border-coral transition-colors">
              <Calendar className="h-5 w-5 text-coral" />
              <span className="text-xs font-medium text-text">New Event</span>
            </div>
          </Link>
          <Link to={`/voucher/new?business=${id}`}>
            <div className="flex flex-col items-center gap-2 p-4 bg-surface rounded-xl border border-border hover:border-coral transition-colors">
              <Plus className="h-5 w-5 text-coral" />
              <span className="text-xs font-medium text-text">New Voucher</span>
            </div>
          </Link>
          <Link to={`/business/${id}/edit`}>
            <div className="flex flex-col items-center gap-2 p-4 bg-surface rounded-xl border border-border hover:border-coral transition-colors">
              <Pencil className="h-5 w-5 text-coral" />
              <span className="text-xs font-medium text-text">Edit Page</span>
            </div>
          </Link>
          <Link to={`/business/${id}`}>
            <div className="flex flex-col items-center gap-2 p-4 bg-surface rounded-xl border border-border hover:border-coral transition-colors">
              <Eye className="h-5 w-5 text-coral" />
              <span className="text-xs font-medium text-text">View Public</span>
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-2xl font-bold text-text">{activeVouchers.length}</p>
            <p className="text-xs text-text-muted">Active Vouchers</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-2xl font-bold text-text">{totalRedemptions}</p>
            <p className="text-xs text-text-muted">Total Redemptions</p>
          </div>
        </div>

        {/* Locations */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">Locations</h2>
            <button onClick={() => setShowAddLocation(!showAddLocation)} className="text-sm text-coral font-medium">
              {showAddLocation ? 'Cancel' : '+ Add'}
            </button>
          </div>

          {showAddLocation && (
            <div className="mb-3 p-4 bg-surface rounded-xl border border-coral/20 space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Location name</label>
                <input
                  type="text"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder='e.g. "Soho Branch", "Main Store"'
                  maxLength={60}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Address</label>
                <PlacesAutocomplete
                  onSelect={handlePlaceSelect}
                  userLocation={userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null}
                  placeholder="Search for the address..."
                />
              </div>
              {newLocationPlace && (
                <p className="text-xs text-text-muted">
                  Selected: {newLocationPlace.address}
                </p>
              )}
              <GradientButton
                fullWidth
                size="sm"
                onClick={handleSaveLocation}
                isLoading={isAddingLocation}
                disabled={!newLocationPlace || !newLocationName.trim()}
              >
                Add Location
              </GradientButton>
            </div>
          )}

          {locations.length === 0 ? (
            <div className="text-center py-6 bg-surface rounded-xl border border-border">
              <MapPin className="h-6 w-6 text-text-light mx-auto mb-2" />
              <p className="text-sm text-text-muted">No locations added</p>
            </div>
          ) : (
            <div className="space-y-2">
              {locations.map((loc) => (
                <div key={loc.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
                  <MapPin className="h-4 w-4 text-coral flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{loc.name}</p>
                    <p className="text-xs text-text-muted truncate">{loc.address}</p>
                  </div>
                  {loc.is_primary && (
                    <span className="text-[10px] font-medium text-coral bg-coral/10 px-2 py-0.5 rounded-full">Primary</span>
                  )}
                  <button
                    onClick={() => handleDeleteLocation(loc.id)}
                    className="p-1 text-text-light hover:text-error transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vouchers list */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">Vouchers</h2>
            <Link to={`/voucher/new?business=${id}`} className="text-sm text-coral font-medium">
              + Add
            </Link>
          </div>

          {vouchers.length === 0 ? (
            <div className="text-center py-8 bg-surface rounded-xl border border-border">
              <Ticket className="h-8 w-8 text-text-light mx-auto mb-2" />
              <p className="text-sm text-text-muted">No vouchers yet</p>
              <Link to={`/voucher/new?business=${id}`} className="text-sm text-coral font-medium mt-2 inline-block">
                Create your first voucher
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vouchers.map((v) => (
                <VoucherTile key={v.id} voucher={v} />
              ))}
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="border-t border-border pt-6">
          {showDeleteConfirm ? (
            <div className="bg-error/5 border border-error/20 rounded-xl p-4">
              <p className="text-sm text-text font-medium mb-3">
                Delete "{business?.name}"? This will remove all vouchers too.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 text-sm text-text-muted hover:text-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2 text-sm text-white bg-error rounded-lg font-medium hover:bg-error/90 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-sm text-error hover:text-error/80 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete business
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
