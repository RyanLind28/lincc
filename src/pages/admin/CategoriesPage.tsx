import { useState, useEffect, useMemo } from 'react';
import { Header } from '../../components/layout';
import { Button, Input, Modal, GradientButton, ChatListSkeleton, CategoryIcon } from '../../components/ui';
import { Plus, Edit2, Trash2, Tag, ChevronDown, ChevronRight } from 'lucide-react';
import { fetchCategories, saveCategory, deleteCategory } from '../../services/adminService';
import { useToast } from '../../contexts/ToastContext';

interface Category {
  id: string;
  name: string;
  icon: string;
  value: string;
  is_active: boolean;
  sort_order: number;
  parent_id: string | null;
  image?: string | null;
}

interface ParentNode extends Category {
  children: Category[];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [newParentId, setNewParentId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { showToast } = useToast();

  const loadCategories = async () => {
    setIsLoading(true);
    const { data } = await fetchCategories();
    setCategories(data as Category[]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const tree = useMemo<ParentNode[]>(() => {
    const parents = categories.filter((c) => !c.parent_id);
    return parents.map((p) => ({
      ...p,
      children: categories
        .filter((c) => c.parent_id === p.id)
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    }));
  }, [categories]);

  const totalParents = tree.length;
  const totalChildren = categories.length - totalParents;

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAddParent = () => {
    setEditingCategory(null);
    setNewName('');
    setNewIcon('');
    setNewParentId('');
    setIsModalOpen(true);
  };

  const handleAddChild = (parent: ParentNode) => {
    setEditingCategory(null);
    setNewName('');
    setNewIcon(parent.icon);
    setNewParentId(parent.id);
    setIsModalOpen(true);
    setExpanded((prev) => new Set(prev).add(parent.id));
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setNewName(category.name);
    setNewIcon(category.icon);
    setNewParentId(category.parent_id ?? '');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!newName.trim() || !newIcon.trim()) {
      showToast('Name and icon are required', 'error');
      return;
    }
    setIsSaving(true);
    const value = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const sortOrder = editingCategory?.sort_order ?? categories.length;
    const result = await saveCategory(
      editingCategory?.id ?? null,
      newName.trim(),
      newIcon.trim(),
      value,
      sortOrder,
      newParentId || null,
    );

    if (result.success) {
      showToast(editingCategory ? 'Saved' : 'Added', 'success');
      setIsModalOpen(false);
      loadCategories();
    } else {
      showToast(result.error || 'Failed to save', 'error');
    }
    setIsSaving(false);
  };

  const handleDelete = async (cat: Category) => {
    const isParent = !cat.parent_id;
    const childCount = isParent ? categories.filter((c) => c.parent_id === cat.id).length : 0;
    const confirmMsg = isParent && childCount > 0
      ? `Delete "${cat.name}" and its ${childCount} subcategor${childCount === 1 ? 'y' : 'ies'}?`
      : `Delete "${cat.name}"?`;
    if (!window.confirm(confirmMsg)) return;
    const result = await deleteCategory(cat.id);
    if (result.success) {
      showToast('Deleted', 'success');
      loadCategories();
    } else {
      showToast(result.error || 'Failed to delete', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header
        title="Categories"
        showBack
        rightContent={
          <GradientButton size="sm" onClick={handleAddParent}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </GradientButton>
        }
      />

      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <p className="text-sm text-text-muted mb-4">
          {totalParents} categor{totalParents === 1 ? 'y' : 'ies'} · {totalChildren} subcategor{totalChildren === 1 ? 'y' : 'ies'}
        </p>

        {isLoading ? (
          <ChatListSkeleton count={8} />
        ) : tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 mt-8">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
              <Tag className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-1">No categories</h2>
            <p className="text-text-muted text-center text-sm mb-4">Add your first category to get started.</p>
            <GradientButton onClick={handleAddParent}>Add category</GradientButton>
          </div>
        ) : (
          <div className="space-y-2">
            {tree.map((parent) => {
              const isOpen = expanded.has(parent.id);
              return (
                <div key={parent.id} className="bg-surface rounded-2xl border border-border overflow-hidden">
                  <div className="flex items-center gap-3 p-3.5">
                    <button
                      onClick={() => toggleExpand(parent.id)}
                      className="p-1 text-text-muted hover:text-text"
                      aria-label={isOpen ? 'Collapse' : 'Expand'}
                    >
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <div className="w-9 h-9 rounded-xl bg-coral/10 flex items-center justify-center flex-shrink-0">
                      <CategoryIcon icon={parent.icon} className="text-coral" size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text truncate">{parent.name}</p>
                      <p className="text-xs text-text-muted truncate">
                        {parent.icon} · {parent.value} · {parent.children.length} subcategor{parent.children.length === 1 ? 'y' : 'ies'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddChild(parent)}
                      className="p-2 rounded-lg text-coral hover:bg-coral/10 transition-colors"
                      title="Add subcategory"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(parent)}
                      className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-background transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(parent)}
                      className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {isOpen && parent.children.length > 0 && (
                    <div className="border-t border-border divide-y divide-border bg-background/50">
                      {parent.children.map((child) => (
                        <div key={child.id} className="flex items-center gap-3 p-3 pl-12">
                          <div className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0">
                            <CategoryIcon icon={child.icon} className="text-text-muted" size="xs" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text truncate">{child.name}</p>
                            <p className="text-[11px] text-text-muted truncate">{child.value}</p>
                          </div>
                          <button
                            onClick={() => handleEdit(child)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-background transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(child)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {isOpen && parent.children.length === 0 && (
                    <div className="border-t border-border p-3 pl-12 text-xs text-text-muted">
                      No subcategories yet.{' '}
                      <button onClick={() => handleAddChild(parent)} className="text-coral font-medium">Add one →</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingCategory
            ? `Edit ${editingCategory.parent_id ? 'subcategory' : 'category'}`
            : newParentId
              ? 'Add subcategory'
              : 'Add category'
        }
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Parent</label>
            <select
              value={newParentId}
              onChange={(e) => setNewParentId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-border bg-surface text-text text-sm focus:border-coral focus:outline-none"
            >
              <option value="">— top-level category —</option>
              {tree.map((p) => (
                <option key={p.id} value={p.id} disabled={editingCategory?.id === p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Icon (Lucide name)"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            placeholder="e.g. Coffee, Trophy, Heart"
          />
          <Input
            label="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Coffee, Brunch"
          />
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <GradientButton onClick={handleSave} fullWidth isLoading={isSaving}>
              Save
            </GradientButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
