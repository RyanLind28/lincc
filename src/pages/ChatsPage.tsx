import { Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { GradientButton } from '../components/ui';
import { MessageCircle } from 'lucide-react';

export default function ChatsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header showLogo showCreateEvent showNotifications />

      <div className="flex flex-col items-center justify-center p-8 mt-20">
        <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-text mb-2">No chats yet</h2>
        <p className="text-text-muted text-center max-w-xs mb-6">
          Join an event to start chatting with other participants.
        </p>
        <Link to="/">
          <GradientButton>Browse Events</GradientButton>
        </Link>
      </div>
    </div>
  );
}
