import { useState } from 'react';
import { Header } from '../../components/layout';
import { Input, Select } from '../../components/ui';
import { Search, Calendar } from 'lucide-react';

export default function AdminEventsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Event Management" showBack />

      <div className="p-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'expired', label: 'Expired' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center p-8 mt-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">No events yet</h2>
          <p className="text-text-muted text-center max-w-xs">
            Events will appear here once users create them. Connect your Supabase to see real data.
          </p>
        </div>
      </div>
    </div>
  );
}
