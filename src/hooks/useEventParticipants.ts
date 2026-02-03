// Hook for managing event participation

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  requestToJoin,
  cancelRequest,
  approveParticipant,
  rejectParticipant,
  getParticipants,
  getUserParticipation,
} from '../services/events/participantService';
import type { EventParticipantWithProfile, ParticipantStatus, JoinMode } from '../types';

interface UseEventParticipantsResult {
  // Data
  participants: EventParticipantWithProfile[];
  userStatus: ParticipantStatus | null;
  pendingCount: number;
  // Loading states
  isLoading: boolean;
  isJoining: boolean;
  isUpdating: boolean;
  // Error state
  error: string | null;
  // Actions
  join: () => Promise<{ success: boolean; error?: string }>;
  leave: () => Promise<{ success: boolean; error?: string }>;
  approve: (userId: string) => Promise<{ success: boolean; error?: string }>;
  reject: (userId: string) => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
}

export function useEventParticipants(
  eventId: string | undefined,
  joinMode: JoinMode = 'request'
): UseEventParticipantsResult {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<EventParticipantWithProfile[]>([]);
  const [userStatus, setUserStatus] = useState<ParticipantStatus | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch participants and user status
  const fetchData = useCallback(async () => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all participants
      const participantsResult = await getParticipants(eventId);
      if (participantsResult.success && participantsResult.data) {
        setParticipants(participantsResult.data);
        // Calculate pending count from fetched data
        const pending = participantsResult.data.filter((p) => p.status === 'pending').length;
        setPendingCount(pending);
      }

      // Fetch user's participation status
      if (user?.id) {
        const userResult = await getUserParticipation(eventId, user.id);
        setUserStatus(userResult.status);
      }
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError(err instanceof Error ? err.message : 'Failed to load participants');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Join event
  const join = useCallback(async () => {
    if (!eventId || !user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsJoining(true);
    setError(null);

    try {
      const result = await requestToJoin(eventId, user.id, joinMode);
      if (result.success) {
        // Update local state
        const newStatus = joinMode === 'auto' ? 'approved' : 'pending';
        setUserStatus(newStatus);
        await fetchData(); // Refresh full data
      } else {
        setError(result.error || 'Failed to join event');
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to join event';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsJoining(false);
    }
  }, [eventId, user?.id, joinMode, fetchData]);

  // Leave event or cancel request
  const leave = useCallback(async () => {
    if (!eventId || !user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsJoining(true);
    setError(null);

    try {
      const result = await cancelRequest(eventId, user.id);
      if (result.success) {
        setUserStatus(null);
        await fetchData(); // Refresh full data
      } else {
        setError(result.error || 'Failed to leave event');
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to leave event';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsJoining(false);
    }
  }, [eventId, user?.id, fetchData]);

  // Approve participant (host action)
  const approve = useCallback(
    async (userId: string) => {
      if (!eventId) {
        return { success: false, error: 'No event ID' };
      }

      setIsUpdating(true);
      setError(null);

      try {
        const result = await approveParticipant(eventId, userId);
        if (result.success) {
          await fetchData(); // Refresh full data
        } else {
          setError(result.error || 'Failed to approve participant');
        }
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to approve participant';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsUpdating(false);
      }
    },
    [eventId, fetchData]
  );

  // Reject participant (host action)
  const reject = useCallback(
    async (userId: string) => {
      if (!eventId) {
        return { success: false, error: 'No event ID' };
      }

      setIsUpdating(true);
      setError(null);

      try {
        const result = await rejectParticipant(eventId, userId);
        if (result.success) {
          await fetchData(); // Refresh full data
        } else {
          setError(result.error || 'Failed to reject participant');
        }
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to reject participant';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsUpdating(false);
      }
    },
    [eventId, fetchData]
  );

  return {
    participants,
    userStatus,
    pendingCount,
    isLoading,
    isJoining,
    isUpdating,
    error,
    join,
    leave,
    approve,
    reject,
    refresh: fetchData,
  };
}
