import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '../components/layout';
import { GradientButton, Input } from '../components/ui';
import { Send } from 'lucide-react';

export default function ChatRoomPage() {
  const { id: roomId } = useParams();
  console.debug('Chat room:', roomId); // Will be used for Supabase integration
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) return;
    // TODO: Send message via Supabase
    setMessage('');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header showBack showLogo />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
        <div className="text-center text-text-muted py-8">
          <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="h-6 w-6 text-white" />
          </div>
          <p className="font-medium text-text mb-1">Event Chat</p>
          <p className="text-sm">Chat functionality coming soon</p>
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border p-4 bg-surface safe-bottom">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <GradientButton onClick={handleSend} disabled={!message.trim()}>
            <Send className="h-4 w-4" />
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
