import { splitStart } from '@platform/contracts';
import { useEffect } from 'react';

// A bot button opens the Mini App with a parameter: a chat (docs/07) or a shared trip (docs/43).
export function launchParam(name: string, pattern: RegExp): string | null {
  const value = new URLSearchParams(window.location.search).get(name);
  return value !== null && pattern.test(value) ? value : null;
}

// Once opened, the link is forgotten: going back shows the main screen.
export function forgetLaunchParam(name: string): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(name);
  window.history.replaceState(window.history.state, '', url);
}

// The start parameter of a t.me/<bot>?startapp=<value> link (a channel post, docs/15). Telegram
// gives it to the Mini App in the address, as a query or a hash parameter.
const START_PARAM = 'tgWebAppStartParam';
function rawStart(): string | null {
  const query = new URLSearchParams(window.location.search).get(START_PARAM);
  return query ?? new URLSearchParams(window.location.hash.slice(1)).get(START_PARAM);
}

// The link without the mark of its source: the screens of links read it as before (G55, docs/116).
export function startParam(): string | null {
  const raw = rawStart();
  return raw === null ? null : splitStart(raw).start;
}

// The mark of the source of the link: a channel, an ad, a driver's story (G55, docs/116).
export function startVia(): string | null {
  const raw = rawStart();
  return raw === null ? null : splitStart(raw).via;
}

// The start parameter stays in the address (Telegram's own, and the source of the launch,
// docs/89 S3); a used one is marked in the page's history state instead.
const USED_START = 'usedStartParam';
const historyState = (): Record<string, unknown> => {
  const state: unknown = window.history.state;
  return typeof state === 'object' && state !== null ? { ...state } : {};
};

// The start parameter for a link screen: none once a link of this launch used it (docs/94 B10).
export function freshStartParam(): string | null {
  const value = startParam();
  return value !== null && historyState()[USED_START] !== value ? value : null;
}

// A link opens once (docs/94 B10): when its screen is shown, its bot parameters and the start
// parameter are forgotten, so the gates mounted again (registration, a new session) never open it
// a second time. Forgotten after the render, so a second render of React's strict mode still sees it.
export function useLinkOpened(opened: boolean, names: readonly string[]) {
  useEffect(() => {
    if (!opened) return;
    names.forEach(forgetLaunchParam);
    const value = startParam();
    if (value !== null) window.history.replaceState({ ...historyState(), [USED_START]: value }, '');
  }, [opened, names]);
}
