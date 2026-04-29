import { Link } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import { Badge } from '../ui';
import { businessHref } from '../../services/businessService';
import type { Business } from '../../types';

interface BusinessCardProps {
  business: Business;
  linkTo?: string;
}

export function BusinessCard({ business, linkTo }: BusinessCardProps) {
  const href = linkTo || businessHref(business);

  return (
    <Link
      to={href}
      className="flex items-center gap-4 bg-surface rounded-2xl p-4 border border-border hover:border-coral/30 transition-colors group"
    >
      {/* Logo */}
      <div className="w-14 h-14 rounded-xl bg-background overflow-hidden flex-shrink-0">
        {business.logo_url ? (
          <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full gradient-primary flex items-center justify-center text-white font-bold text-xl">
            {business.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-text group-hover:text-coral transition-colors truncate">
          {business.name}
        </h3>
        <Badge variant="outline" className="text-xs mt-1">{business.category}</Badge>
        {business.address && (
          <p className="text-xs text-text-muted mt-1 flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {business.address}
          </p>
        )}
      </div>

      <ChevronRight className="h-5 w-5 text-text-light group-hover:text-coral transition-colors flex-shrink-0" />
    </Link>
  );
}
