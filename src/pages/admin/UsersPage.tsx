import { useState } from 'react';
import { Header } from '../../components/layout';
import { Input } from '../../components/ui';
import { Search, Users } from 'lucide-react';

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="User Management" showBack />

      <div className="p-4 space-y-4">
        {/* Search */}
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          leftIcon={<Search className="h-4 w-4" />}
        />

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center p-8 mt-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">No users yet</h2>
          <p className="text-text-muted text-center max-w-xs">
            Users will appear here once they sign up. Connect your Supabase to see real data.
          </p>
        </div>
      </div>
    </div>
  );
}
