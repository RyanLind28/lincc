import { useState, useEffect, useCallback } from 'react';
import { Header } from '../../components/layout';
import { Input, Badge, GradientButton, Modal, Button, ChatListSkeleton, Card, CardContent, Skeleton } from '../../components/ui';
import { Search, Calendar, MapPin, Users, Trash2, X as XIcon, Download, Flag } from 'lucide-react';
import { fetchAdminEvents, updateEventStatus, getEventAnalytics, exportEventsCSV, flagEvent, logAdminAction } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatRelativeTime } from '../../lib/utils';

interface AdminEvent {
  id: string;
  title: string;
  venue_name: string | null;
  start_time: string;
  status: string;
  participant_count: number;
  capacity: number;
  host_id: string;
  category_id: string;
  created_at: string;
  profiles: { first_name: string } | null;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'full', label: 'Full' },
];

export default function AdminEventsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const { user: authUser } = useAuth();
  const [analytics, setAnalytics] = useState<{ total: number; active: number; expired: number; cancelled: number; totalJoins: number } | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    getEventAnalytics().then(setAnalytics);
  }, []);

  const handleExport = async () => {
    const data = await exportEventsCSV();
    const headers = ['id', 'title', 'venue_name', 'start_time', 'status', 'participant_count', 'capacity', 'created_at'];
    const csv = [
      headers.join(','),
      ...data.map((row: Record<string, unknown>) => headers.map((h) => `"${row[h] ?? ''}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lincc-events-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Events exported', 'success');
  };

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    const { data } = await fetchAdminEvents(searchQuery, statusFilter);
    setEvents(data as unknown as AdminEvent[]);
    setIsLoading(false);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(loadEvents, 300);
    return () => clearTimeout(timeout);
  }, [loadEvents]);

  const handleCancel = async (eventId: string) => {
    const result = await updateEventStatus(eventId, 'cancelled');
    if (result.success) {
      if (authUser?.id) logAdminAction(authUser.id, 'event_cancelled', 'event', eventId);
      showToast('Event cancelled', 'success');
      setSelectedEvent(null);
      loadEvents();
    } else {
      showToast(result.error || 'Failed to cancel', 'error');
    }
  };

  const handleDelete = async (eventId: string) => {
    const result = await updateEventStatus(eventId, 'deleted');
    if (result.success) {
      if (authUser?.id) logAdminAction(authUser.id, 'event_deleted', 'event', eventId);
      showToast('Event deleted', 'success');
      setSelectedEvent(null);
      loadEvents();
    } else {
      showToast(result.error || 'Failed to delete', 'error');
    }
  };

  const handleFlag = async (eventId: string) => {
    const reason = prompt('Flag reason:');
    if (!reason) return;
    const result = await flagEvent(eventId, reason);
    if (result.success) {
      if (authUser?.id) logAdminAction(authUser.id, 'flag_event', 'event', eventId, { reason });
      showToast('Event flagged', 'success');
      setSelectedEvent(null);
    } else {
      showToast(result.error || 'Failed to flag', 'error');
    }
  };

  const statusColor = (status: string): 'success' | 'primary' | 'error' | 'default' => {
    switch (status) {
      case 'active': return 'success';
      case 'full': return 'primary';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Event Management" showBack />

      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
        {/* Event analytics summary */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total', value: analytics?.total, color: 'text-text' },
            { label: 'Active', value: analytics?.active, color: 'text-green-500' },
            { label: 'Joins', value: analytics?.totalJoins, color: 'text-purple' },
          ].map((stat) => (
            <Card key={stat.label} variant="outlined" padding="sm">
              <CardContent className="text-center py-2">
                {analytics === null ? (
                  <Skeleton className="h-6 w-8 mx-auto mb-1" />
                ) : (
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                )}
                <p className="text-[10px] text-text-muted uppercase">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <button
            onClick={handleExport}
            className="p-2.5 rounded-xl border border-border bg-surface text-text-muted hover:text-text transition-colors"
            title="Export CSV"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === opt.value
                  ? 'gradient-primary text-white'
                  : 'bg-surface border border-border text-text-muted hover:text-text'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <ChatListSkeleton count={5} />
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 mt-8">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-1">No events found</h2>
            <p className="text-text-muted text-center text-sm">
              {searchQuery || statusFilter ? 'Try different filters.' : 'No events have been created yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-background transition-colors"
              >
                <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-coral" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text truncate">{event.title}</p>
                  {event.venue_name && (
                    <p className="text-sm text-text-muted flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {event.venue_name}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-text-light mt-0.5">
                    <span>{(event.profiles as { first_name: string } | null)?.first_name || 'Unknown'}</span>
                    <span className="flex items-center gap-0.5">
                      <Users className="h-3 w-3" />
                      {event.participant_count}/{event.capacity}
                    </span>
                  </div>
                </div>
                <Badge variant={statusColor(event.status)} size="sm">
                  {event.status}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Event Details"
        size="sm"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-text text-lg">{selectedEvent.title}</h3>
              {selectedEvent.venue_name && (
                <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {selectedEvent.venue_name}
                </p>
              )}
              <p className="text-sm text-text-muted mt-1">
                Host: {(selectedEvent.profiles as { first_name: string } | null)?.first_name || 'Unknown'}
              </p>
              <p className="text-xs text-text-light mt-1">
                Created {formatRelativeTime(selectedEvent.created_at)}
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge variant={statusColor(selectedEvent.status)}>
                {selectedEvent.status}
              </Badge>
              <Badge variant="default">
                {selectedEvent.participant_count}/{selectedEvent.capacity} participants
              </Badge>
            </div>

            <div className="border-t border-border pt-4 flex gap-2 flex-wrap">
              <Button variant="ghost" size="sm" onClick={() => handleFlag(selectedEvent.id)}>
                <Flag className="h-3.5 w-3.5 mr-1" />
                Flag
              </Button>
              {selectedEvent.status === 'active' && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => handleCancel(selectedEvent.id)}>
                    <XIcon className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(selectedEvent.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>

            <GradientButton
              variant="outline"
              fullWidth
              onClick={() => window.open(`/event/${selectedEvent.id}`, '_blank')}
            >
              View Event Page
            </GradientButton>
          </div>
        )}
      </Modal>
    </div>
  );
}
