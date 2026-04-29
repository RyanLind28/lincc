import { HostReviewsList } from './HostReviewsList';
import { GuestReviewsList } from './GuestReviewsList';

interface EventReviewsSectionProps {
  eventId: string;
  hostId: string;
}

export function EventReviewsSection({ eventId, hostId }: EventReviewsSectionProps) {
  return (
    <div className="space-y-6">
      <HostReviewsList eventId={eventId} hostId={hostId} />
      <GuestReviewsList eventId={eventId} hostId={hostId} />
    </div>
  );
}
