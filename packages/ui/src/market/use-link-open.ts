import type { AppLink } from '@platform/contracts';
import { useEffect, useRef } from 'react';

// A bot link opens its booking, offer or trip once the list is loaded (docs/65 B5); after that the
// person moves freely and the link is not applied again.
export function useLinkOpen<T>(
  link: AppLink | undefined,
  value: T | null,
  open: (link: AppLink, value: T) => void,
) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !link || value === null) return;
    done.current = true;
    open(link, value);
  });
}
