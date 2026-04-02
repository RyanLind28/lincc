import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Store } from 'lucide-react';
import { Header } from '../components/layout';
import { GradientButton } from '../components/ui';
import { BusinessCard } from '../components/business/BusinessCard';
import { useAuth } from '../contexts/AuthContext';
import { getBusinessesByOwner } from '../services/businessService';
import type { Business } from '../types';

export default function MyBusinessesPage() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getBusinessesByOwner(user.id).then((data) => {
      setBusinesses(data);
      setIsLoading(false);
    });
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background max-w-2xl mx-auto">
      <Header showBack showLogo showNotifications />

      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text">My Businesses</h1>
          <Link to="/business/new">
            <GradientButton size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New
            </GradientButton>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-surface rounded-2xl border border-border animate-pulse" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-1">No businesses yet</h2>
            <p className="text-sm text-text-muted text-center mb-4 max-w-xs">
              Create a business page to start posting vouchers and events.
            </p>
            <Link to="/business/new">
              <GradientButton>
                <Plus className="h-4 w-4 mr-1" />
                Create Business
              </GradientButton>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {businesses.map((biz) => (
              <BusinessCard
                key={biz.id}
                business={biz}
                linkTo={`/business/${biz.id}/dashboard`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
