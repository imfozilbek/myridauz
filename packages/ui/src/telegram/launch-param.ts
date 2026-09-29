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
