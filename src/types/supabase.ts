export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          dob: string
          gender: 'female' | 'male'
          avatar_url: string | null
          bio: string | null
          tags: string[]
          settings_radius: number
          is_ghost_mode: boolean
          is_women_only_mode: boolean
          terms_accepted_at: string | null
          role: 'user' | 'admin'
          status: 'active' | 'suspended' | 'banned'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          dob: string
          gender: 'female' | 'male'
          avatar_url?: string | null
          bio?: string | null
          tags?: string[]
          settings_radius?: number
          is_ghost_mode?: boolean
          is_women_only_mode?: boolean
          terms_accepted_at?: string | null
          role?: 'user' | 'admin'
          status?: 'active' | 'suspended' | 'banned'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          dob?: string
          gender?: 'female' | 'male'
          avatar_url?: string | null
          bio?: string | null
          tags?: string[]
          settings_radius?: number
          is_ghost_mode?: boolean
          is_women_only_mode?: boolean
          terms_accepted_at?: string | null
          role?: 'user' | 'admin'
          status?: 'active' | 'suspended' | 'banned'
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          icon: string
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          icon?: string
          is_active?: boolean
          sort_order?: number
        }
      }
      events: {
        Row: {
          id: string
          host_id: string
          category_id: string
          title: string
          description: string | null
          custom_category: string | null
          venue_name: string
          venue_address: string
          venue_lat: number
          venue_lng: number
          venue_place_id: string | null
          start_time: string
          capacity: number
          join_mode: 'request' | 'auto'
          audience: 'everyone' | 'women' | 'men'
          status: 'active' | 'full' | 'expired' | 'cancelled' | 'deleted'
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          host_id: string
          category_id: string
          title: string
          description?: string | null
          custom_category?: string | null
          venue_name: string
          venue_address: string
          venue_lat: number
          venue_lng: number
          venue_place_id?: string | null
          start_time: string
          capacity: number
          join_mode: 'request' | 'auto'
          audience: 'everyone' | 'women' | 'men'
          status?: 'active' | 'full' | 'expired' | 'cancelled' | 'deleted'
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          custom_category?: string | null
          venue_name?: string
          venue_address?: string
          venue_lat?: number
          venue_lng?: number
          venue_place_id?: string | null
          start_time?: string
          capacity?: number
          join_mode?: 'request' | 'auto'
          audience?: 'everyone' | 'women' | 'men'
          status?: 'active' | 'full' | 'expired' | 'cancelled' | 'deleted'
        }
      }
      event_participants: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: 'pending' | 'approved' | 'rejected' | 'left'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status: 'pending' | 'approved' | 'rejected' | 'left'
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'approved' | 'rejected' | 'left'
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          event_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          content?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_user_id: string
          event_id: string | null
          reason: string
          details: string | null
          status: 'pending' | 'reviewed' | 'dismissed' | 'actioned'
          admin_notes: string | null
          created_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_user_id: string
          event_id?: string | null
          reason: string
          details?: string | null
          status?: 'pending' | 'reviewed' | 'dismissed' | 'actioned'
          admin_notes?: string | null
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          status?: 'pending' | 'reviewed' | 'dismissed' | 'actioned'
          admin_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
      }
      blocks: {
        Row: {
          id: string
          blocker_id: string
          blocked_id: string
          created_at: string
        }
        Insert: {
          id?: string
          blocker_id: string
          blocked_id: string
          created_at?: string
        }
        Update: never
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string
          data: Json
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body: string
          data?: Json
          is_read?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
        }
      }
    }
  }
}
