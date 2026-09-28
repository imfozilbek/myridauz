import { Component, type ContextType, type ReactNode } from 'react';
import { AnalyticsContext } from '../context/analytics-context';
import { ErrorScreen } from './error-screen';

type State = { readonly failed: boolean };

// A render error shows a friendly screen and is reported to analytics (docs/29).
export class ErrorBoundary extends Component<{ readonly children: ReactNode }, State> {
  static override contextType = AnalyticsContext;
  declare context: ContextType<typeof AnalyticsContext>;
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(): void {
    this.context?.track({ name: 'client_error', screen: 'app', code: 'render' });
  }

  override render() {
    if (this.state.failed) return <ErrorScreen onRetry={() => this.setState({ failed: false })} />;
    return this.props.children;
  }
}
