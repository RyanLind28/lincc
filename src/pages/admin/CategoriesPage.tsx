import { useState, useEffect } from 'react';
import { Header } from '../../components/layout';
import { Button, Input, Modal, GradientButton, ChatListSkeleton } from '../../components/ui';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { fetchCategories, saveCategory, deleteCategory } from '../../services/adminService';
import { useToast } from '../../contexts/ToastContext';

interface Category {
  id: string;
  name: string;
  icon: string;
  value: string;
  is_active: boolean;
  sort_order: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [isSaving, setIsSaving] = useState(false);
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

  const handleAdd = () => {
    setEditingCategory(null);
    setNewName('');
    setNewIcon('');
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setNewName(category.name);
    setNewIcon(category.icon);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!newName.trim() || !newIcon.trim()) {
      showToast('Name and icon are required', 'error');
      return;
    }
    setIsSaving(true);
    const value = newName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const sortOrder = editingCategory?.sort_order ?? categories.length;
    const result = await saveCategory(
      editingCategory?.id ?? null,
      newName.trim(),
      newIcon.trim(),
      value,
      sortOrder
    );

    if (result.success) {
      showToast(editingCategory ? 'Category updated' : 'Category added', 'success');
      setIsModalOpen(false);
      loadCategories();
    } else {
      showToast(result.error || 'Failed to save', 'error');
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteCategory(id);
    if (result.success) {
      showToast('Category deleted', 'success');
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
          <GradientButton size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </GradientButton>
        }
      />

      <div className="p-4">
        <p className="text-sm text-text-muted mb-4">
          Manage the categories available for events. {categories.length} categories total.
        </p>

        {isLoading ? (
          <ChatListSkeleton count={8} />
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 mt-8">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
              <Tag className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-1">No categories</h2>
            <p className="text-text-muted text-center text-sm mb-4">Add your first category to get started.</p>
            <GradientButton onClick={handleAdd}>Add Category</GradientButton>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-3 p-3.5 hover:bg-background transition-colors"
              >
                <span className="text-xl w-8 text-center">{category.icon}</span>
                <span className="flex-1 font-medium text-text">{category.name}</span>
                <button
                  onClick={() => handleEdit(category)}
                  className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-background transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Icon (emoji or Lucide name)"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            placeholder="e.g., Coffee or ☕"
          />
          <Input
            label="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g., Coffee"
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
