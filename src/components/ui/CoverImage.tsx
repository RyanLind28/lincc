import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { CATEGORIES } from '../../data/categories';

const GENERIC_STOCK = CATEGORIES.find((c) => c.value === 'other')?.image
  ?? 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=450&fit=crop';

// Business category labels (BUSINESS_CATEGORIES) → event category value
// (CATEGORIES). Used so a voucher with `business.category = 'Restaurant'`
// gets the food stock image instead of the generic "Other" fallback.
const BUSINESS_TO_EVENT_CATEGORY: Record<string, string> = {
  'Restaurant': 'food',
  'Cafe': 'coffee',
  'Bar & Pub': 'food',
  'Nightclub': 'social',
  'Retail Shop': 'other',
  'Gym & Fitness': 'fitness',
  'Salon & Spa': 'wellness',
  'Entertainment': 'entertainment',
  'Hotel & Accommodation': 'social',
  'Takeaway': 'food',
  'Market & Pop-up': 'social',
};

// Map a Lincc category icon (Lucide name) or label to a stock image URL.
// Used for the broken/missing cover fallback so feeds/cards never show a
// browser-default broken-image icon.
export function resolveStockImage({
  icon,
  name,
}: {
  icon?: string | null;
  name?: string | null;
}): string {
  if (name) {
    const byName = CATEGORIES.find((c) => c.label.toLowerCase() === name.toLowerCase());
    if (byName) return byName.image;
    // Subcategory match (e.g. "Brunch" → food)
    for (const cat of CATEGORIES) {
      const sub = cat.subcategories.find((s) => s.label.toLowerCase() === name.toLowerCase());
      if (sub?.image) return sub.image;
      if (sub) return cat.image;
    }
    // Business category label (e.g. "Cafe", "Gym & Fitness")
    const mapped = BUSINESS_TO_EVENT_CATEGORY[name];
    if (mapped) {
      const cat = CATEGORIES.find((c) => c.value === mapped);
      if (cat) return cat.image;
    }
  }
  if (icon) {
    const byIcon = CATEGORIES.find((c) => c.icon === icon);
    if (byIcon) return byIcon.image;
  }
  return GENERIC_STOCK;
}

export interface CoverImageProps {
  /** Stored cover URL — may be null, empty, or fail to load. */
  src?: string | null;
  /** Category icon (Lucide name) for stock fallback. */
  categoryIcon?: string | null;
  /** Category label for stock fallback (more precise than icon when known). */
  categoryName?: string | null;
  /** Explicit fallback URL — overrides category lookup if provided. */
  fallbackSrc?: string;
  alt: string;
  className?: string;
  /** Defaults to "lazy" — set "eager" for above-the-fold hero images. */
  loading?: 'lazy' | 'eager';
}

// Renders the cover image with a runtime fallback to the Lincc stock image
// when the primary URL is missing or fails to load. After the fallback also
// errors, we render a neutral grey backdrop rather than a broken-image icon.
export function CoverImage({
  src,
  categoryIcon,
  categoryName,
  fallbackSrc,
  alt,
  className,
  loading = 'lazy',
}: CoverImageProps) {
  const resolvedFallback = fallbackSrc ?? resolveStockImage({ icon: categoryIcon, name: categoryName });
  const initialSrc = src && src.trim() ? src : resolvedFallback;

  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [stage, setStage] = useState<'primary' | 'fallback' | 'dead'>(
    src && src.trim() ? 'primary' : 'fallback',
  );

  // Reset if the upstream URL changes (e.g. when scrolling through a list and
  // the row recycles, or when the category changes after a form edit).
  useEffect(() => {
    const next = src && src.trim() ? src : resolvedFallback;
    setCurrentSrc(next);
    setStage(src && src.trim() ? 'primary' : 'fallback');
  }, [src, resolvedFallback]);

  if (stage === 'dead') {
    return <div className={cn('bg-muted', className)} aria-label={alt} role="img" />;
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => {
        if (stage === 'primary') {
          setCurrentSrc(resolvedFallback);
          setStage('fallback');
        } else {
          setStage('dead');
        }
      }}
    />
  );
}
