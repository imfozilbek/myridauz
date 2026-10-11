import type { DriverApplication } from '@platform/contracts';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useApiClients } from '../context/api-clients';
import { useFeedChange } from '../feed/feed-context';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { KeptBehind } from '../telegram/kept-behind';
import { ApplicationFlow } from './application-flow';
import { DriverContext, type Driver } from './driver-context';
import { StatusScreen } from './status-screen';

type Loaded = { readonly application: DriverApplication | null };

const LOOKING_AROUND = new Set<DriverApplication['status']>([
  'approved',
  'pending',
  'draft',
  'changes_requested',
]);
// No application on the server yet: nothing is sent, no photo is taken.
const NEW_APPLICATION: DriverApplication = {
  status: 'draft',
  car: null,
  photos: { front: false, side: false, interior: false },
  reasons: [],
};

// An approved driver works in the driver Mini App (docs/04). A driver whose application is not sent
// yet (G34), is being checked or has a fix asked looks around the app; publishing waits for the
// approval. A fix asked opens at once (G62); a rejected application shows why.
export function DriverGate({ children }: { readonly children: ReactNode }) {
  const { drivers } = useApiClients();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  // A sent application starts the app again on the main screen, which says it is checked (G62).
  const [round, setRound] = useState(0);
  const load = useCallback(() => {
    setFailed(false);
    drivers.getApplication().then(
      (application) => {
        setLoaded({ application });
        if (application?.status === 'changes_requested') setEditing(true);
      },
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
  const close = useCallback(() => setEditing(false), []);
  const submitted = useCallback((application: DriverApplication) => {
    // No «Ariza yuborildi»: the main screen says the application is checked (G62).
    setLoaded({ application });
    setEditing(false);
    setRound((count) => count + 1);
  }, []);
  const application = loaded?.application ?? null;
  const driver = useMemo<Driver | null>(() => {
    const shown = application ?? NEW_APPLICATION;
    return LOOKING_AROUND.has(shown.status) ? { application: shown, editCar } : null;
  }, [application, editCar]);

  if (failed) return <ErrorScreen onRetry={load} />;
  if (!loaded) return <ScreenSkeleton />;
  // «Назад» out of the application comes back where it was opened: «Profil», the main screen (G77).
  const form = editing ? (
    <ApplicationFlow initial={application} onSubmitted={submitted} onClose={close} />
  ) : null;
  if (!driver) return form ?? (application ? <StatusScreen application={application} /> : null);
  return (
    <>
      <KeptBehind key={round} under={editing}>
        <DriverContext.Provider value={driver}>{children}</DriverContext.Provider>
      </KeptBehind>
      {form}
    </>
  );
}
