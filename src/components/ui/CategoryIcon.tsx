import {
  Coffee,
  Utensils,
  Dumbbell,
  Trophy,
  TreePine,
  Heart,
  Film,
  Gamepad2,
  Palette,
  BookOpen,
  PartyPopper,
  Dog,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  Coffee,
  Utensils,
  Dumbbell,
  Trophy,
  TreePine,
  Heart,
  Film,
  Gamepad2,
  Palette,
  BookOpen,
  PartyPopper,
  Dog,
};

interface CategoryIconProps {
  icon: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

export function CategoryIcon({ icon, className, size = 'md' }: CategoryIconProps) {
  const IconComponent = iconMap[icon];

  if (!IconComponent) {
    // Fallback to a default icon
    return <Coffee className={cn(sizeMap[size], className)} />;
  }

  return <IconComponent className={cn(sizeMap[size], className)} />;
}

// Export the icon map for direct access if needed
export { iconMap };
