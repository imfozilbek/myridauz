import { useEffect, useState } from 'react';

type Lists = { readonly value: unknown; readonly refresh: () => Promise<void> };

// The lists of the main screen may be older than the person's own last step (a trip just published,
// a request just sent): no signal comes for it. A screen that reads them refreshes them once as it
// opens, quietly; true once they are fresh, so a link waits for it to open its item (G77). Lists still
// loading for the first time are fresh already.
export function useFreshLists(lists: Lists | null, wanted = true): boolean {
  const [fresh, setFresh] = useState(() => lists === null || lists.value === null);
  useEffect(() => {
    if (fresh || !lists || !wanted) return undefined;
    let live = true;
    void lists.refresh().then(() => live && setFresh(true));
    return () => void (live = false);
    // Once, when the screen opens or the lists are first wanted.
  }, [wanted]);
  return fresh && lists?.value !== null;
}
