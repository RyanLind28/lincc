import { useState, type ImgHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { User } from 'lucide-react';

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

function Avatar({ src, name, size = 'md', className, ...props }: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const sizes = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-20 w-20 text-2xl',
  };

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
    xl: 'h-10 w-10',
  };

  // Get initials from name
  const getInitials = (name?: string) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const showFallback = !src || hasError;

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full bg-gray-200 overflow-hidden flex-shrink-0',
        sizes[size],
        className
      )}
    >
      {!showFallback ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
          {...props}
        />
      ) : name ? (
        <span className="font-medium text-text-muted select-none">
          {getInitials(name)}
        </span>
      ) : (
        <User className={cn('text-text-muted', iconSizes[size])} />
      )}
    </div>
  );
}

export { Avatar };
