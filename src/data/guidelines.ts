import { Shield, Users, Clock, Heart, Store, BadgeCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Guideline {
  icon: LucideIcon;
  title: string;
  description: string;
}

// Personal accounts — community safety and conduct.
export const personalGuidelines: Guideline[] = [
  {
    icon: Shield,
    title: 'Safety First',
    description: 'Always meet in public places. Trust your instincts and report any suspicious behaviour.',
  },
  {
    icon: Users,
    title: 'Respectful Interactions',
    description: 'Treat everyone with respect. Harassment, discrimination, and inappropriate behaviour are not tolerated.',
  },
  {
    icon: Clock,
    title: 'Be Reliable',
    description: 'Honour your commitments. If you can\'t make it, let others know as soon as possible.',
  },
  {
    icon: Heart,
    title: 'Platonic Connections',
    description: 'Lincc is for friendship and activity partners. This is not a dating app.',
  },
];

// Business accounts — listing integrity and conduct toward guests.
export const businessGuidelines: Guideline[] = [
  {
    icon: BadgeCheck,
    title: 'Honest Listings',
    description: 'Represent your business accurately. Only post genuine deals, offers, and events.',
  },
  {
    icon: Users,
    title: 'Respectful Interactions',
    description: 'Treat every guest with respect. Harassment, discrimination, and inappropriate behaviour are not tolerated.',
  },
  {
    icon: Clock,
    title: 'Reliable Offers',
    description: 'Honour what you advertise. If a deal or event changes, update or remove it promptly.',
  },
  {
    icon: Store,
    title: 'Genuine Local Value',
    description: 'Lincc is for real, local experiences. No spam, misleading promotions, or off-platform selling.',
  },
];
