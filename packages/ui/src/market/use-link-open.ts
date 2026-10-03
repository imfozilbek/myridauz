import type { AppLink } from '@platform/contracts';
import { useLayoutEffect, useRef } from 'react';

// A bot link opens its booking, offer or trip once the list is loaded (docs/65 B5); after that the
// person moves freely and the link is not applied again. Before the first paint: the list is never
// seen for a frame under the opened booking (G41, docs/108 F).
export function useLinkOpen<T>(
  link: AppLink | undefined,
  value: T | null,
  open: (link: AppLink, value: T) => void,
) {
  const done = useRef(false);
  useLayoutEffect(() => {
    if (done.current || !link || value === null) return;
    done.current = true;
    open(link, value);
  });
}
