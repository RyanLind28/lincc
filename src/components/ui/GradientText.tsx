import { type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface GradientTextProps extends HTMLAttributes<HTMLSpanElement> {
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'p';
  variant?: 'primary' | 'secondary';
}

export function GradientText({
  as: Component = 'span',
  variant = 'primary',
  className,
  children,
  ...props
}: GradientTextProps) {
  const gradients = {
    primary: 'bg-gradient-to-r from-coral to-purple',
    secondary: 'bg-gradient-to-r from-purple to-blue',
  };

  return (
    <Component
      className={cn(
        gradients[variant],
        'bg-clip-text text-transparent',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
