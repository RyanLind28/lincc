import { useEffect, useMemo, useState } from 'react';
import { Header } from '../../components/layout';
import { Button, Modal, ChatListSkeleton } from '../../components/ui';
import { Trash2, ExternalLink, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  fetchAdminImages,
  deleteAdminImage,
  type AdminImage,
  type ImageBucket,
} from '../../services/adminService';

const BUCKETS: { id: ImageBucket; label: string; description: string }[] = [
  { id: 'avatars', label: 'Avatars', description: 'Profile photos' },
  { id: 'event-images', label: 'Event covers', description: 'Event cover images' },
  { id: 'business-logos', label: 'Business logos', description: 'Business profile logos' },
];

function formatBytes(bytes: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminImagesPage() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const [bucket, setBucket] = useState<ImageBucket>('avatars');
  const [images, setImages] = useState<AdminImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<AdminImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const data = await fetchAdminImages(bucket, 200);
    setImages(data);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, [bucket]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return images;
    return images.filter(
      (img) =>
        img.name.toLowerCase().includes(q) ||
        img.path.toLowerCase().includes(q) ||
        (img.ownerName ?? '').toLowerCase().includes(q),
    );
  }, [images, search]);

  const handleDelete = async () => {
    if (!confirmDelete || !authUser?.id) return;
    setIsDeleting(true);
    const result = await deleteAdminImage(authUser.id, confirmDelete.bucket, confirmDelete.path);
    setIsDeleting(false);
    if (result.success) {
      setImages((prev) => prev.filter((i) => i.path !== confirmDelete.path));
      showToast('Image deleted', 'success');
      setConfirmDelete(null);
    } else {
      showToast(result.error ?? 'Failed to delete image', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Images" showBack />

      <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
        {/* Bucket tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {BUCKETS.map((b) => (
            <button
              key={b.id}
              onClick={() => setBucket(b.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                bucket === b.id
                  ? 'gradient-primary text-white'
                  : 'bg-surface border border-border text-text hover:border-coral/40'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by file name, path or owner"
            className="flex-1 h-10 px-3 rounded-xl border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-coral/40"
          />
          <Button variant="secondary" onClick={load} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <p className="text-xs text-text-muted">
          {isLoading ? 'Loading…' : `${filtered.length} of ${images.length} image${images.length === 1 ? '' : 's'}`}
          {' · '}
          {BUCKETS.find((b) => b.id === bucket)?.description}
        </p>

        {/* Grid */}
        {isLoading ? (
          <ChatListSkeleton />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No images found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((img) => (
              <div
                key={`${img.bucket}/${img.path}`}
                className="bg-surface rounded-2xl border border-border overflow-hidden flex flex-col"
              >
                <div className="aspect-square bg-background relative">
                  <img
                    src={img.publicUrl}
                    alt={img.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.opacity = '0.2';
                    }}
                  />
                </div>
                <div className="p-3 flex-1 flex flex-col gap-2">
                  <p className="text-xs font-medium text-text truncate" title={img.path}>
                    {img.name}
                  </p>
                  <div className="text-[11px] text-text-muted space-y-0.5">
                    <p className="truncate" title={img.ownerName ?? img.ownerId ?? ''}>
                      {img.ownerName ? `Owner: ${img.ownerName}` : img.ownerId ? 'Owner: (unknown)' : '—'}
                    </p>
                    <p>{formatBytes(img.size)} · {formatDate(img.updatedAt)}</p>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <a
                      href={img.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1 h-8 px-2 rounded-lg border border-border text-xs text-text hover:border-coral/40 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" /> Open
                    </a>
                    <button
                      onClick={() => setConfirmDelete(img)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border text-coral hover:bg-coral/10 transition-colors"
                      aria-label="Delete image"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!confirmDelete} onClose={() => !isDeleting && setConfirmDelete(null)} title="Delete image?">
        {confirmDelete && (
          <div className="space-y-4">
            <div className="aspect-video bg-background rounded-xl overflow-hidden border border-border">
              <img src={confirmDelete.publicUrl} alt={confirmDelete.name} className="w-full h-full object-contain" />
            </div>
            <p className="text-sm text-text-muted">
              This permanently removes <span className="font-medium text-text">{confirmDelete.name}</span> from the{' '}
              <span className="font-medium text-text">{confirmDelete.bucket}</span> bucket and clears any references on
              the owning record. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
