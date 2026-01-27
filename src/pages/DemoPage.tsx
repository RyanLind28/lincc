import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  GradientButton,
  GradientText,
  Input,
  TextArea,
  Select,
  SearchBar,
  FilterPills,
  ViewToggle,
  Card,
  CardContent,
  Avatar,
  Badge,
  ChipGroup,
  Spinner,
  Modal,
  BottomSheet,
  type ViewMode,
} from '../components/ui';
import { Header, BottomNav } from '../components/layout';
import { MapPin, Clock, Users, Plus, Heart } from 'lucide-react';

const DEMO_TAGS = [
  { value: 'coffee', label: 'Coffee', icon: '☕' },
  { value: 'sports', label: 'Sports', icon: '⚽' },
  { value: 'hiking', label: 'Hiking', icon: '🥾' },
  { value: 'gaming', label: 'Gaming', icon: '🎮' },
  { value: 'music', label: 'Music', icon: '🎵' },
  { value: 'yoga', label: 'Yoga', icon: '🧘' },
];

export default function DemoPage() {
  const [inputValue, setInputValue] = useState('');
  const [textValue, setTextValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['coffee']);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Lincc Demo" showNotifications />

      <div className="p-4 space-y-8">
        {/* Hero with gradient branding */}
        <div className="text-center py-8">
          <GradientText as="h1" className="text-5xl font-bold mb-2">
            Lincc
          </GradientText>
          <p className="text-text-muted">Connect with people nearby, right now.</p>
          <p className="text-sm text-text-light mt-4">
            This is a demo page showing all UI components
          </p>
        </div>

        {/* Gradient Buttons */}
        <section>
          <h2 className="text-lg font-semibold text-text mb-4">Gradient Buttons</h2>
          <div className="flex flex-wrap gap-2">
            <GradientButton>Primary Gradient</GradientButton>
            <GradientButton variant="secondary">Secondary</GradientButton>
            <GradientButton variant="outline">Outline</GradientButton>
            <GradientButton size="sm">Small</GradientButton>
            <GradientButton size="lg">Large</GradientButton>
            <GradientButton isLoading>Loading</GradientButton>
            <GradientButton leftIcon={<Heart className="h-4 w-4" />}>With Icon</GradientButton>
          </div>
        </section>

        {/* Search Bar */}
        <section>
          <h2 className="text-lg font-semibold text-text mb-4">Search Bar</h2>
          <SearchBar
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onClear={() => setSearchValue('')}
            placeholder="What do you want to do?"
          />
        </section>

        {/* Filter Pills */}
        <section>
          <h2 className="text-lg font-semibold text-text mb-4">Filter Pills</h2>
          <FilterPills
            options={[
              { value: 'now', label: 'Now', icon: '🔴' },
              { value: '1hr', label: '< 1hr', icon: '⏰' },
              { value: 'today', label: 'Today', icon: '📅' },
            ]}
            selected={selectedFilters}
            onChange={setSelectedFilters}
          />
        </section>

        {/* View Toggle */}
        <section>
          <h2 className="text-lg font-semibold text-text mb-4">View Toggle</h2>
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-lg font-semibold text-text mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button isLoading>Loading</Button>
            <Button leftIcon={<Plus className="h-4 w-4" />}>With Icon</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
          </div>
        </section>

        {/* Inputs */}
        <section>
          <h2 className="text-lg font-semibold text-text mb-4">Inputs</h2>
          <div className="space-y-4">
            <Input
              label="Email"
              placeholder="you@example.com"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input
              label="With Error"
              placeholder="Enter something"
              error="This field is required"
            />
            <Input
              label="With Icon"
              placeholder="Search..."
              leftIcon={<MapPin className="h-4 w-4" />}
            />
            <TextArea
              label="Bio"
              placeholder="Tell us about yourself..."
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              maxLength={140}
              showCount
              rows={3}
            />
            <Select
              label="Category"
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
              placeholder="Select a category"
              options={[
                { value: 'coffee', label: 'Coffee' },
                { value: 'sports', label: 'Sports' },
                { value: 'hiking', label: 'Hiking' },
              ]}
            />
          </div>
        </section>

        {/* Chips */}
        <section>
          <h2 className="text-lg font-semibold text-text mb-4">Chips / Tags</h2>
          <p className="text-sm text-text-muted mb-3">Select up to 3 interests:</p>
          <ChipGroup
            options={DEMO_TAGS}
            selected={selectedTags}
            onChange={setSelectedTags}
            max={3}
          />
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-lg font-semibold text-text mb-4">Badges</h2>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </section>

        {/* Avatars */}
        <section>
          <h2 className="text-lg font-semibold text-text mb-4">Avatars</h2>
          <div className="flex items-end gap-3">
            <Avatar size="xs" name="John" />
            <Avatar size="sm" name="Jane" />
            <Avatar size="md" name="Bob" />
            <Avatar size="lg" name="Alice" />
            <Avatar size="xl" name="Sam" />
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-lg font-semibold text-text mb-4">Cards</h2>

          {/* Event Card Example */}
          <Card variant="elevated" className="mb-4">
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl">
                  ☕
                </div>
                <div className="flex-1">
                  <Badge variant="primary" size="sm" className="mb-1">Coffee</Badge>
                  <h3 className="font-semibold text-text">Morning Coffee Chat</h3>
                  <div className="flex items-center gap-2 text-sm text-text-muted mt-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Today at 10:00 AM</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Blue Bottle Coffee</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Avatar size="sm" name="Sarah" />
                  <span className="text-sm text-text">Sarah, 28</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-text-muted">
                  <Users className="h-4 w-4" />
                  <span>2 spots left</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Card Example */}
          <Card variant="outlined">
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar size="lg" name="Alex" />
                <div>
                  <h3 className="font-semibold text-text">Alex, 32</h3>
                  <p className="text-sm text-text-muted">Coffee lover & weekend hiker</p>
                  <div className="flex gap-1 mt-2">
                    <Badge size="sm">☕ Coffee</Badge>
                    <Badge size="sm">🥾 Hiking</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Spinners */}
        <section>
          <h2 className="text-lg font-semibold text-text mb-4">Spinners</h2>
          <div className="flex items-center gap-4">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </div>
        </section>

        {/* Modal & Bottom Sheet */}
        <section>
          <h2 className="text-lg font-semibold text-text mb-4">Overlays</h2>
          <div className="flex gap-2">
            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
            <Button variant="outline" onClick={() => setIsSheetOpen(true)}>
              Open Bottom Sheet
            </Button>
          </div>
        </section>

        {/* Colors */}
        <section>
          <h2 className="text-lg font-semibold text-text mb-4">Color Palette</h2>
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="aspect-square bg-coral rounded-lg" title="Coral" />
            <div className="aspect-square bg-purple rounded-lg" title="Purple" />
            <div className="aspect-square bg-blue rounded-lg" title="Blue" />
            <div className="aspect-square gradient-primary rounded-lg" title="Gradient Primary" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="aspect-square bg-success rounded-lg" title="Success" />
            <div className="aspect-square bg-error rounded-lg" title="Error" />
            <div className="aspect-square bg-warning rounded-lg" title="Warning" />
            <div className="aspect-square bg-text rounded-lg" title="Text" />
          </div>
          <p className="text-xs text-text-muted mt-2">Top row: Coral, Purple, Blue, Gradient</p>
        </section>

        {/* Navigation Links */}
        <section>
          <h2 className="text-lg font-semibold text-text mb-4">Pages</h2>
          <div className="space-y-2">
            <Link to="/login" className="block p-3 bg-surface rounded-lg border border-border hover:border-primary transition-colors">
              Login Page →
            </Link>
            <Link to="/signup" className="block p-3 bg-surface rounded-lg border border-border hover:border-primary transition-colors">
              Signup Page →
            </Link>
          </div>
        </section>
      </div>

      {/* Bottom Nav */}
      <BottomNav />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Example Modal"
      >
        <p className="text-text-muted mb-4">
          This is a modal dialog. You can put any content here.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={() => setIsModalOpen(false)} className="flex-1">
            Confirm
          </Button>
        </div>
      </Modal>

      {/* Bottom Sheet */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Filter Events"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Category</label>
            <ChipGroup
              options={DEMO_TAGS}
              selected={selectedTags}
              onChange={setSelectedTags}
              max={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Distance</label>
            <input type="range" className="w-full accent-primary" />
            <div className="flex justify-between text-xs text-text-muted">
              <span>1 km</span>
              <span>20 km</span>
            </div>
          </div>
          <Button className="w-full" onClick={() => setIsSheetOpen(false)}>
            Apply Filters
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
