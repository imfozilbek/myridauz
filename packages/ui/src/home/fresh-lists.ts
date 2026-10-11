import { useEffect, useRef, useState } from 'react';
import { useBehind } from '../telegram/behind';

type Lists = {
  readonly value: unknown;
  readonly failed: boolean;
  readonly refresh: () => Promise<void>;
  readonly reload: () => void;
};

// The lists of the main screen may be older than the person's own last step (a trip just published,
// a request just sent, an offer answered in a chat over the app): no signal comes for it. A screen
// that reads them refreshes them once as it opens and again as a screen over it closes, quietly;
// true once they are fresh, so a link waits for it to open its item (G77). Lists still loading for
// the first time are fresh already; a first load that failed loads again.
export function useFreshLists(lists: Lists | null, wanted = true): boolean {
  const [fresh, setFresh] = useState(() => lists === null || lists.value === null);
  useEffect(() => {
    if (!lists || !wanted) return undefined;
    if (lists.failed) return void lists.reload();
    if (fresh) return undefined;
    let live = true;
    void lists.refresh().then(() => live && setFresh(true));
    return () => void (live = false);
    // Once, when the screen opens or the lists are first wanted.
  }, [wanted]);
  useComeBack(() => void lists?.refresh());
  return fresh && lists?.value !== null;
}

// A screen over this one closed: a chat, a call, a form.
function useComeBack(back: () => void) {
  const behind = useBehind();
  const was = useRef(behind);
  useEffect(() => {
    if (was.current && !behind) back();
    was.current = behind;
  }, [behind]);
}
