import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { GradientButton } from '../components/ui';
import { Calendar, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

type Tab = 'hosting' | 'joined';

export default function MyEventsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('hosting');

  return (
    <div className="min-h-screen bg-background">
      <Header showLogo showCreateEvent showNotifications />

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('hosting')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'hosting'
              ? 'text-coral border-b-2 border-coral'
              : 'text-text-muted hover:text-text'
          )}
        >
          Hosting
        </button>
        <button
          onClick={() => setActiveTab('joined')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'joined'
              ? 'text-coral border-b-2 border-coral'
              : 'text-text-muted hover:text-text'
          )}
        >
          Joined
        </button>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center p-8 mt-12">
        <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
          <Calendar className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-text mb-2">
          {activeTab === 'hosting' ? 'No events hosted' : 'No events joined'}
        </h2>
        <p className="text-text-muted text-center max-w-xs mb-6">
          {activeTab === 'hosting'
            ? 'Create an event to start connecting with others.'
            : 'Browse events to find something you\'d like to join.'}
        </p>
        <Link to={activeTab === 'hosting' ? '/event/new' : '/'}>
          <GradientButton leftIcon={activeTab === 'hosting' ? <Plus className="h-4 w-4" /> : undefined}>
            {activeTab === 'hosting' ? 'Create Event' : 'Browse Events'}
          </GradientButton>
        </Link>
      </div>
    </div>
  );
}
