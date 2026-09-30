import type { DriverApplication } from '@platform/contracts';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useApiClients } from '../context/api-clients';
import { useFeedChange } from '../feed/feed-context';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { ApplicationFlow } from './application-flow';
import { DriverContext, type Driver } from './driver-context';
import { StatusScreen } from './status-screen';

type Loaded = { readonly application: DriverApplication | null };

const LOOKING_AROUND = new Set<DriverApplication['status']>(['approved', 'pending']);

// An approved driver works in the driver Mini App (docs/04). A driver whose application is being checked
// looks around the app; publishing waits for the approval. Before that: the application or what to fix.
export function DriverGate({ children }: { readonly children: ReactNode }) {
  const { drivers } = useApiClients();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const load = useCallback(() => {
    setFailed(false);
    drivers.getApplication().then(
      (application) => setLoaded({ application }),
      () => setFailed(true),
    );
  }, [drivers]);
  useEffect(load, [load]);
  // The team's decision shows at once (docs/64, lesson 36); a form being filled is never replaced.
  useFeedChange(() => {
    if (!editing)
      drivers.getApplication().then(
        (application) => setLoaded({ application }),
        () => undefined,
      );
  });
  const editCar = useCallback(() => setEditing(true), []);
  const submitted = useCallback((application: DriverApplication) => {
    setLoaded({ application });
    setEditing(false);
  }, []);
  const application = loaded?.application ?? null;
  const driver = useMemo<Driver | null>(
    () => (application && LOOKING_AROUND.has(application.status) ? { application, editCar } : null),
    [application, editCar],
  );

  if (failed) return <ErrorScreen onRetry={load} />;
  if (!loaded) return <ScreenSkeleton />;
  if (!editing && driver) return <DriverContext.Provider value={driver}>{children}</DriverContext.Provider>;
  if (!editing && application && application.status !== 'draft') {
    return <StatusScreen application={application} onFix={editCar} />;
  }
  const close = application?.status === 'approved' ? { onClose: () => setEditing(false) } : {};
  return <ApplicationFlow initial={application} onSubmitted={submitted} {...close} />;
}
