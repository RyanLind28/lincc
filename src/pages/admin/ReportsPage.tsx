import { Header } from '../../components/layout';
import { Flag } from 'lucide-react';

export default function AdminReportsPage() {
  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Report Queue" showBack />

      <div className="p-4">
        {/* Empty state */}
        <div className="flex flex-col items-center justify-center p-8 mt-8">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
            <Flag className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">No pending reports</h2>
          <p className="text-text-muted text-center max-w-xs">
            Great news! There are no user reports to review at this time.
          </p>
        </div>
      </div>
    </div>
  );
}
