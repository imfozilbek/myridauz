import { REASON_PLACE, type ModerationReason, type ProblemPlace } from '@platform/contracts';
import { useEffect, useRef, useState } from 'react';
import { useAccount } from '../account/account-context';
import { useApiClients } from '../context/api-clients';

// What the team asked to fix (docs/04); a place leaves the list once it is changed.
// The server drops the reasons of a new photo or face; fields changed here are cleared on sending.
export function useReasons(initial: readonly ModerationReason[]) {
  const { drivers } = useApiClients();
  const [reasons, setReasons] = useState(initial);
  const keepOnly = (left: readonly ModerationReason[]) =>
    setReasons((list) => list.filter((item) => left.includes(item)));
  const fixed = (place: ProblemPlace) =>
    setReasons((list) => list.filter((item) => REASON_PLACE[item] !== place));

  // A new selfie: the application is read again to show only what is left to fix.
  const avatarVersion = useAccount()?.avatarVersion ?? 0;
  const first = useRef(avatarVersion);
  useEffect(() => {
    if (avatarVersion === first.current) return;
    void drivers.getApplication().then(
      (application) => application && keepOnly(application.reasons),
      () => undefined,
    );
    // Only a new photo reads the application again.
  }, [avatarVersion]);

  return { reasons, keepOnly, fixed };
}
