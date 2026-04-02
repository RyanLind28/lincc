import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, AlertTriangle } from 'lucide-react';
import { Header } from '../components/layout';
import { Avatar, Badge, GradientButton, EventDetailSkeleton } from '../components/ui';
import { VoucherTile } from '../components/ui/VoucherTile';
import { BusinessHoursDisplay } from '../components/business/BusinessHoursDisplay';
import { useAuth } from '../contexts/AuthContext';
import { getBusinessById, getLocationsByBusiness } from '../services/businessService';
import { getActiveVouchersByBusiness } from '../services/voucherService';
import type { BusinessWithOwner, BusinessLocation, VoucherWithDetails } from '../types';

export default function BusinessPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [business, setBusiness] = useState<BusinessWithOwner | null>(null);
  const [vouchers, setVouchers] = useState<VoucherWithDetails[]>([]);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isOwner = user?.id === business?.owner_id;

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const biz = await getBusinessById(id);
      setBusiness(biz);

      if (biz) {
        const [v, locs] = await Promise.all([
          getActiveVouchersByBusiness(biz.id),
          getLocationsByBusiness(biz.id),
        ]);
        setVouchers(v);
        setLocations(locs);
      }
      setIsLoading(false);
    };

    load();
  }, [id]);

  if (isLoading) return <EventDetailSkeleton />;

  if (!business) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack showLogo />
        <div className="flex flex-col items-center justify-center p-8 mt-20">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Business not found</h2>
          <p className="text-text-muted text-center mb-4 max-w-xs">
            This business page may have been removed.
          </p>
          <Link to="/businesses">
            <GradientButton>Browse Businesses</GradientButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6 max-w-3xl mx-auto">
      <Header showBack showLogo showNotifications />

      <div className="px-4 mt-2">
        {/* Business header card */}
        <div className="bg-surface rounded-2xl shadow-lg overflow-hidden mb-4">
          {/* Logo banner */}
          <div className="h-32 gradient-primary flex items-center justify-center relative">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-white text-5xl font-bold">{business.name.charAt(0)}</span>
            )}
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-2xl font-bold text-text">{business.name}</h1>
                <Badge variant="outline" className="mt-1">{business.category}</Badge>
              </div>
              {isOwner && (
                <Link to={`/business/${business.id}/dashboard`}>
                  <GradientButton size="sm">Manage</GradientButton>
                </Link>
              )}
            </div>

            {business.description && (
              <p className="text-text-muted mt-3">{business.description}</p>
            )}

            {business.address && (
              <p className="text-sm text-text-muted mt-3 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-coral flex-shrink-0" />
                {business.address}
              </p>
            )}

            {business.opening_hours && (
              <div className="mt-4 pt-4 border-t border-border">
                <BusinessHoursDisplay hours={business.opening_hours} />
              </div>
            )}

            {/* Owner */}
            <Link
              to={`/user/${business.owner.id}`}
              className="flex items-center gap-3 mt-4 pt-4 border-t border-border group"
            >
              <Avatar src={business.owner.avatar_url} name={business.owner.first_name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted">Managed by</p>
                <p className="font-medium text-text group-hover:text-coral transition-colors truncate">
                  {business.owner.first_name}
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Locations */}
        {locations.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
              Locations
            </h2>
            <div className="space-y-2">
              {locations.map((loc) => (
                <div key={loc.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
                  <MapPin className="h-4 w-4 text-coral flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text">{loc.name}</p>
                    <p className="text-xs text-text-muted truncate">{loc.address}</p>
                  </div>
                  {loc.is_primary && (
                    <span className="text-[10px] font-medium text-coral bg-coral/10 px-2 py-0.5 rounded-full">Main</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vouchers */}
        {vouchers.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
              Vouchers & Deals
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vouchers.map((v) => (
                <VoucherTile key={v.id} voucher={v} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
