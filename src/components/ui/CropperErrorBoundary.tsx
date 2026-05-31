import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logUpload } from '../../lib/uploadDebug';

interface Props {
  children: ReactNode;
}
interface State {
  error: string | null;
}

/**
 * Catches any error thrown while rendering the avatar cropper and writes it to
 * the upload debug panel, instead of letting it bubble to the route error
 * boundary (which would blank the page) or get swallowed silently. Lets a
 * tester's trace show the EXACT crash message from react-easy-crop on-device.
 * Pre-launch debugging aid — remove once the cropper issue is resolved.
 */
export class CropperErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? `${error.name}: ${error.message}` : String(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    logUpload('cropper:CRASHED', msg.slice(0, 200));
    // First component-stack frame is usually enough to spot the culprit.
    const firstFrame = info.componentStack?.trim().split('\n')[0]?.trim();
    if (firstFrame) logUpload('cropper:crash-at', firstFrame.slice(0, 120));
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
          <div className="max-w-sm w-full rounded-2xl bg-surface border border-error/40 p-4 text-center">
            <p className="font-semibold text-error mb-1">Photo editor failed to open</p>
            <p className="text-xs text-text-muted break-words">{this.state.error}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
