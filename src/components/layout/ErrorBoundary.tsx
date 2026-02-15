import { Component, type ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, retryCount: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
          <div className="w-14 h-14 rounded-full bg-coral/10 flex items-center justify-center mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h2 className="text-lg font-semibold text-text mb-1">Something went wrong</h2>
          <p className="text-sm text-text-muted mb-4 max-w-sm">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          {this.state.retryCount < 3 && (
            <button
              onClick={this.handleRetry}
              className="px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:shadow-lg transition-all"
            >
              Try Again
            </button>
          )}
          {this.state.retryCount >= 3 && (
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-gray-100 text-text-muted text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Reload Page
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
