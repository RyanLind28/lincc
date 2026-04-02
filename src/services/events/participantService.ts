// Participant service for event join/leave functionality

import { supabase } from '../../lib/supabase';
import type { EventParticipant, EventParticipantWithProfile, ParticipantStatus, JoinMode } from '../../types';

export interface ParticipantResult {
  success: boolean;
  error?: string;
  data?: EventParticipant;
}

export interface ParticipantsListResult {
  success: boolean;
  error?: string;
  data?: EventParticipantWithProfile[];
}

/**
 * Request to join an event
 * Status depends on event's join_mode: 'approved' for auto, 'pending' for request
 * Handles re-joining after leaving by updating existing 'left' record
 */
export async function requestToJoin(
  eventId: string,
  userId: string,
  joinMode: JoinMode
): Promise<ParticipantResult> {
  const newStatus: ParticipantStatus = joinMode === 'auto' ? 'approved' : 'pending';

  // Check if user has an existing record (e.g. previously left or was rejected)
  const { data: existing } = await supabase
    .from('event_participants')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    // Re-join: update existing record
    if (existing.status === 'left' || existing.status === 'rejected') {
      const { data, error } = await supabase
        .from('event_participants')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error re-joining event:', error);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    }
    // Already pending or approved
    return { success: false, error: 'You have already requested to join this event' };
  }

  // New join: insert record
  const { data, error } = await supabase
    .from('event_participants')
    .insert({
      event_id: eventId,
      user_id: userId,
      status: newStatus,
    })
    .select()
    .single();

  if (error) {
    console.error('Error requesting to join:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Cancel a join request or leave an event
 * Sets status to 'left' instead of deleting to keep history
 */
export async function cancelRequest(eventId: string, userId: string): Promise<ParticipantResult> {
  const { data, error } = await supabase
    .from('event_participants')
    .update({ status: 'left', updated_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error canceling request:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Approve a participant (host action)
 */
export async function approveParticipant(
  eventId: string,
  userId: string
): Promise<ParticipantResult> {
  const { data, error } = await supabase
    .from('event_participants')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error approving participant:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Reject a participant (host action)
 */
export async function rejectParticipant(
  eventId: string,
  userId: string
): Promise<ParticipantResult> {
  const { data, error } = await supabase
    .from('event_participants')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error rejecting participant:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Get all participants for an event with their profiles
 */
export async function getParticipants(eventId: string): Promise<ParticipantsListResult> {
  const { data, error } = await supabase
    .from('event_participants')
    .select(`
      *,
      user:profiles!user_id(*)
    `)
    .eq('event_id', eventId)
    .neq('status', 'left')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching participants:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as EventParticipantWithProfile[] };
}

/**
 * Get approved participants for an event (for display)
 */
export async function getApprovedParticipants(eventId: string): Promise<ParticipantsListResult> {
  const { data, error } = await supabase
    .from('event_participants')
    .select(`
      *,
      user:profiles!user_id(*)
    `)
    .eq('event_id', eventId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching approved participants:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as EventParticipantWithProfile[] };
}

/**
 * Check if a user has already joined/requested to join an event
 */
export async function getUserParticipation(
  eventId: string,
  userId: string
): Promise<{ status: ParticipantStatus | null; participant: EventParticipant | null }> {
  const { data, error } = await supabase
    .from('event_participants')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error checking participation:', error);
    return { status: null, participant: null };
  }

  // Treat 'left' as no active participation (user can re-join)
  const status = data?.status === 'left' ? null : (data?.status || null);
  return {
    status,
    participant: data,
  };
}

/**
 * Get pending requests count for an event (for host badge)
 */
export async function getPendingRequestsCount(eventId: string): Promise<number> {
  const { count, error } = await supabase
    .from('event_participants')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error counting pending requests:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get user's events where they are an approved participant (for chats)
 */
export async function getUserApprovedEvents(userId: string) {
  const { data, error } = await supabase
    .from('event_participants')
    .select(`
      event_id,
      event:events!event_id(
        *,
        host:profiles!host_id(*),
        category:categories!category_id(*)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'approved');

  if (error) {
    console.error('Error fetching user approved events:', error);
    return [];
  }

  return data?.map((p) => p.event) || [];
}
