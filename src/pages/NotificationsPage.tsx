import { Header } from '../components/layout';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header title="Notifications" showBack />

      <div className="flex flex-col items-center justify-center p-8 mt-20">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Bell className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-text mb-2">No notifications</h2>
        <p className="text-text-muted text-center max-w-xs">
          You're all caught up! Notifications about events and messages will appear here.
        </p>
      </div>
    </div>
  );
}
