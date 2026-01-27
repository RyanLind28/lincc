// User Types
export type Gender = 'man' | 'woman' | 'non-binary';
export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'banned';

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  dob: string;
  gender: Gender;
  avatar_url: string | null;
  bio: string | null;
  tags: string[];
  settings_radius: number;
  is_ghost_mode: boolean;
  is_women_only_mode: boolean;
  terms_accepted_at: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// Event Types
export type JoinMode = 'request' | 'auto';
export type Audience = 'everyone' | 'women' | 'men';
export type EventStatus = 'active' | 'full' | 'expired' | 'cancelled' | 'deleted';

export interface Event {
  id: string;
  host_id: string;
  category_id: string;
  title: string;
  description: string | null;
  venue_name: string;
  venue_address: string;
  venue_lat: number;
  venue_lng: number;
  venue_place_id: string | null;
  start_time: string;
  capacity: number;
  join_mode: JoinMode;
  audience: Audience;
  status: EventStatus;
  created_at: string;
  expires_at: string;
}

export interface EventWithDetails extends Event {
  host: Profile;
  category: Category;
  participant_count: number;
}

// Participant Types
export type ParticipantStatus = 'pending' | 'approved' | 'rejected' | 'left';

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: ParticipantStatus;
  created_at: string;
  updated_at: string;
}

export interface EventParticipantWithProfile extends EventParticipant {
  user: Profile;
}

// Message Types
export interface Message {
  id: string;
  event_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface MessageWithSender extends Message {
  sender: Profile;
}

// Report Types
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'actioned';

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  event_id: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

// Block Types
export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

// Notification Types
export type NotificationType =
  | 'join_request'
  | 'request_approved'
  | 'request_declined'
  | 'new_message'
  | 'event_starting'
  | 'event_cancelled';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// Geolocation Types
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Form Types
export interface CreateEventForm {
  category_id: string;
  title: string;
  description?: string;
  venue_name: string;
  venue_address: string;
  venue_lat: number;
  venue_lng: number;
  venue_place_id?: string;
  start_time: string;
  capacity: number;
  join_mode: JoinMode;
  audience: Audience;
}

export interface UpdateProfileForm {
  first_name: string;
  bio?: string;
  tags: string[];
  avatar_url?: string;
}

export interface OnboardingForm {
  avatar_url: string;
  first_name: string;
  dob: string;
  gender: Gender;
  tags: string[];
  bio?: string;
}
