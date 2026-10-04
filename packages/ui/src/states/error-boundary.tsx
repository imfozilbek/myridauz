import { Component, useContext, type ReactNode } from 'react';
import { AnalyticsContext, currentScreen } from '../context/analytics-context';
import { TelegramContext } from '../telegram/in-telegram-context';
import { crashFacts } from './crash-facts';
import { ErrorScreen } from './error-screen';

type Props = {
  readonly children: ReactNode;
  // A section of the main screen goes back to it: the rest of the app keeps working (G52).
  readonly onBack?: () => void;
};
type CatcherProps = {
  readonly children: ReactNode;
  readonly onBack: (() => void) | undefined;
  readonly report: (error: unknown) => void;
};
type State = { readonly failed: boolean };

class Catcher extends Component<CatcherProps, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: unknown): void {
    this.props.report(error);
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    const { onBack } = this.props;
    const retry = () => this.setState({ failed: false });
    if (!onBack) return <ErrorScreen onRetry={retry} />;
    const back = () => {
      retry();
      onBack();
    };
    return <ErrorScreen onRetry={retry} onBack={back} />;
  }
}

// A render error shows a friendly screen and is reported at once with what broke, on which screen
// and in which Telegram app (docs/29, G52 docs/112).
export function ErrorBoundary({ children, onBack }: Props) {
  const analytics = useContext(AnalyticsContext);
  const { client } = useContext(TelegramContext);
  const report = (error: unknown) => {
    analytics?.track({
      name: 'client_error',
      screen: currentScreen(),
      code: 'render',
      ...crashFacts(error),
      client,
    });
    void analytics?.flush();
  };
  return (
    <Catcher report={report} onBack={onBack}>
      {children}
    </Catcher>
  );
}
