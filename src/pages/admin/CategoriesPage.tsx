import { useState } from 'react';
import { Header } from '../../components/layout';
import { Button, Input, Modal } from '../../components/ui';
import { Plus, Edit2, GripVertical } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Coffee', icon: '☕', is_active: true },
  { id: '2', name: 'Food & Drinks', icon: '🍽️', is_active: true },
  { id: '3', name: 'Sports', icon: '⚽', is_active: true },
  { id: '4', name: 'Fitness', icon: '💪', is_active: true },
  { id: '5', name: 'Walking', icon: '🚶', is_active: true },
  { id: '6', name: 'Hiking', icon: '🥾', is_active: true },
  { id: '7', name: 'Running', icon: '🏃', is_active: true },
  { id: '8', name: 'Cycling', icon: '🚴', is_active: true },
  { id: '9', name: 'Gaming', icon: '🎮', is_active: true },
  { id: '10', name: 'Movies', icon: '🎬', is_active: true },
  { id: '11', name: 'Music', icon: '🎵', is_active: true },
  { id: '12', name: 'Art & Culture', icon: '🎨', is_active: true },
  { id: '13', name: 'Study & Work', icon: '📚', is_active: true },
  { id: '14', name: 'Language Exchange', icon: '🗣️', is_active: true },
  { id: '15', name: 'Board Games', icon: '🎲', is_active: true },
  { id: '16', name: 'Yoga & Wellness', icon: '🧘', is_active: true },
  { id: '17', name: 'Pets', icon: '🐕', is_active: true },
  { id: '18', name: 'Photography', icon: '📷', is_active: true },
  { id: '19', name: 'Shopping', icon: '🛍️', is_active: true },
  { id: '20', name: 'Beach', icon: '🏖️', is_active: true },
  { id: '21', name: 'Other', icon: '📌', is_active: true },
];

export default function AdminCategoriesPage() {
  const [categories] = useState(DEFAULT_CATEGORIES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<typeof DEFAULT_CATEGORIES[0] | null>(null);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('');

  const handleAdd = () => {
    setEditingCategory(null);
    setNewName('');
    setNewIcon('');
    setIsModalOpen(true);
  };

  const handleEdit = (category: typeof DEFAULT_CATEGORIES[0]) => {
    setEditingCategory(category);
    setNewName(category.name);
    setNewIcon(category.icon);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    // TODO: Save to Supabase
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header
        title="Categories"
        showBack
        rightContent={
          <Button size="sm" onClick={handleAdd} leftIcon={<Plus className="h-4 w-4" />}>
            Add
          </Button>
        }
      />

      <div className="p-4">
        <p className="text-sm text-text-muted mb-4">
          Manage the categories available for events. Drag to reorder.
        </p>

        <div className="bg-surface rounded-xl border border-border divide-y divide-border">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 p-3 hover:bg-gray-50"
            >
              <GripVertical className="h-4 w-4 text-text-muted cursor-grab" />
              <span className="text-xl">{category.icon}</span>
              <span className="flex-1 font-medium text-text">{category.name}</span>
              <button
                onClick={() => handleEdit(category)}
                className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-gray-100"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <div className="space-y-4">
          <Input
            label="Icon (emoji)"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            placeholder="e.g., ☕"
            maxLength={2}
          />
          <Input
            label="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g., Coffee"
          />
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
