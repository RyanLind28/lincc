import { useState, useEffect } from 'react';
import { Header } from '../../components/layout';
import { GradientButton, Button, Modal, Input, TextArea, Badge, ChatListSkeleton } from '../../components/ui';
import { Plus, Megaphone, Trash2, Eye, EyeOff } from 'lucide-react';
import { fetchAnnouncements, createAnnouncement, toggleAnnouncement, deleteAnnouncement } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatRelativeTime } from '../../lib/utils';

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('info');
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const load = async () => {
    setIsLoading(true);
    const { data } = await fetchAnnouncements();
    setAnnouncements(data as Announcement[]);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!title.trim() || !body.trim() || !user?.id) return;
    setIsSaving(true);
    const result = await createAnnouncement(title.trim(), body.trim(), type, null, user.id);
    if (result.success) {
      showToast('Announcement created', 'success');
      setShowCreate(false);
      setTitle('');
      setBody('');
      load();
    } else {
      showToast(result.error || 'Failed', 'error');
    }
    setIsSaving(false);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleAnnouncement(id, !isActive);
    load();
  };

  const handleDelete = async (id: string) => {
    const result = await deleteAnnouncement(id);
    if (result.success) {
      showToast('Deleted', 'success');
      load();
    }
  };

  const typeColor = (t: string): 'primary' | 'warning' | 'error' | 'default' => {
    switch (t) {
      case 'info': return 'primary';
      case 'warning': return 'warning';
      case 'maintenance': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header
        title="Announcements"
        showBack
        rightContent={
          <GradientButton size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </GradientButton>
        }
      />

      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        {isLoading ? (
          <ChatListSkeleton count={4} />
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 mt-8">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
              <Megaphone className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-1">No announcements</h2>
            <p className="text-text-muted text-center text-sm mb-4">Create one to notify all users.</p>
            <GradientButton onClick={() => setShowCreate(true)}>Create Announcement</GradientButton>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className={`bg-surface rounded-2xl border border-border p-4 ${!a.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={typeColor(a.type)} size="sm">{a.type}</Badge>
                    {!a.is_active && <Badge variant="default" size="sm">Hidden</Badge>}
                  </div>
                  <span className="text-xs text-text-light">{formatRelativeTime(a.created_at)}</span>
                </div>
                <h3 className="font-semibold text-text mb-1">{a.title}</h3>
                <p className="text-sm text-text-muted mb-3">{a.body}</p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleToggle(a.id, a.is_active)}>
                    {a.is_active ? <><EyeOff className="h-3.5 w-3.5 mr-1" />Hide</> : <><Eye className="h-3.5 w-3.5 mr-1" />Show</>}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Announcement" size="sm">
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Scheduled maintenance" />
          <TextArea label="Message" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Details..." rows={3} />
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Type</label>
            <div className="flex gap-2">
              {['info', 'warning', 'maintenance'].map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${
                    type === t ? 'gradient-primary text-white border-transparent' : 'bg-surface text-text border-border'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <GradientButton onClick={handleCreate} fullWidth isLoading={isSaving}>Publish</GradientButton>
        </div>
      </Modal>
    </div>
  );
}
