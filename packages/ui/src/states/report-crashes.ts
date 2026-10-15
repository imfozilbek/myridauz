import type { AnalyticsClient } from '@platform/api-client';
import { currentScreen } from '../context/analytics-context';
import { crashFacts } from './crash-facts';

type Reporter = Pick<AnalyticsClient, 'track' | 'flush'>;
type Crash = 'uncaught' | 'rejection';

// An error outside a render or a promise nobody caught breaks a screen too: it is sent at once with
// what broke, on which screen and in which Telegram app (G52, docs/112).
export function reportCrashes(analytics: Reporter, client: string, target: EventTarget = window) {
  const report = (code: Crash, thrown: unknown) => {
    analytics.track({ name: 'client_error', screen: currentScreen(), code, ...crashFacts(thrown), client });
    void analytics.flush();
  };
  target.addEventListener('error', (event) => {
    const { error, message } = event as ErrorEvent;
    report('uncaught', error ?? message);
  });
  target.addEventListener('unhandledrejection', (event) =>
    report('rejection', (event as PromiseRejectionEvent).reason),
  );
}
