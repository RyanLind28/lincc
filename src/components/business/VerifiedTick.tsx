import { BadgeCheck } from 'lucide-react';

interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<Props['size']>, string> = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

/**
 * Official verified tick rendered next to a business name when
 * `business.verified === true`.
 */
export function VerifiedTick({ size = 'md', className = '' }: Props) {
  return (
    <BadgeCheck
      className={`fill-coral text-white ${SIZE_CLASS[size]} ${className}`}
      strokeWidth={2.5}
      aria-label="Verified business"
    />
  );
}
