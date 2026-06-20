import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/Button';

/**
 * ErrorBoundary — catches render-time errors in the page tree and shows a
 * recoverable fallback instead of a blank screen. Mounted in PublicLayout and
 * keyed by route so navigating away clears a previous error.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl glass-panel">
            <AlertTriangle className="h-8 w-8 text-red-400" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-content">Something went wrong</h2>
          <p className="mt-1 text-sm text-content-muted">
            An unexpected error occurred while rendering this page.
          </p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
