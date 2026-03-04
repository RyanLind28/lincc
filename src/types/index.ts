// User Types
export type Gender = 'female' | 'male';
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
  notification_preferences: NotificationPreferences | null;
  last_lat: number | null;
  last_lng: number | null;
  is_business: boolean;
  business_name: string | null;
  business_logo_url: string | null;
  business_category: string | null;
  business_description: string | null;
  business_address: string | null;
  business_opening_hours: BusinessOpeningHours | null;
  created_at: string;
  updated_at: string;
}

// Business Types
export interface BusinessOpeningHours {
  monday?: { open: string; close: string } | null;
  tuesday?: { open: string; close: string } | null;
  wednesday?: { open: string; close: string } | null;
  thursday?: { open: string; close: string } | null;
  friday?: { open: string; close: string } | null;
  saturday?: { open: string; close: string } | null;
  sunday?: { open: string; close: string } | null;
}

export interface BusinessOnboardingForm {
  business_name: string;
  business_category: string;
  business_description?: string;
  business_address?: string;
  business_logo_url?: string;
}

export interface CreateVoucherForm {
  title: string;
  discount_text: string;
  original_price?: number;
  discounted_price?: number;
  category_id?: string;
  terms?: string;
  venue_name: string;
  venue_address: string;
  venue_lat: number;
  venue_lng: number;
  cover_image_url?: string;
  expires_at: string;
}

export const BUSINESS_CATEGORIES = [
  'Restaurant',
  'Cafe',
  'Bar & Pub',
  'Nightclub',
  'Retail Shop',
  'Gym & Fitness',
  'Salon & Spa',
  'Entertainment',
  'Hotel & Accommodation',
  'Takeaway',
  'Market & Pop-up',
  'Other',
] as const;

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
  custom_category: string | null;
  cover_image_url: string | null;
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
  | 'event_cancelled'
  | 'nearby_event'
  | 'voucher_shared';

// Notification preference keys (toggleable push types)
export interface NotificationPreferences {
  join_request: boolean;
  request_approved: boolean;
  request_declined: boolean;
  new_message: boolean;
  event_cancelled: boolean;
  event_starting: boolean;
  nearby_event: boolean;
  voucher_shared: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // "HH:MM" format
  quiet_hours_end: string;   // "HH:MM" format
}

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

// Direct Message Types
export type DMMessageType = 'text' | 'voucher_share' | 'event_share';

export interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  last_message_at: string;
  created_at: string;
}

export interface ConversationWithDetails extends Conversation {
  other_user: Profile;
  last_message: DirectMessage | null;
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: DMMessageType;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DirectMessageWithSender extends DirectMessage {
  sender: Profile;
}

// Voucher Types
export type VoucherStatus = 'active' | 'expired' | 'redeemed' | 'deleted';

export interface Voucher {
  id: string;
  business_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  discount_text: string;
  original_price: number | null;
  discounted_price: number | null;
  redemption_code: string | null;
  redemption_limit: number | null;
  redemption_count: number;
  terms: string | null;
  cover_image_url: string | null;
  venue_name: string;
  venue_address: string;
  venue_lat: number;
  venue_lng: number;
  expires_at: string;
  status: VoucherStatus;
  created_at: string;
}

export interface VoucherWithDetails extends Voucher {
  business: Profile;
  category: Category | null;
}
