// The admin bot opens the Mini App on one application: "?application=<user id>" (docs/50).
const PARAM = 'application';

export function linkedApplication(): number | null {
  const id = Number(new URLSearchParams(window.location.search).get(PARAM));
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Once opened, the link is forgotten: going back shows the queue, not the same application again.
export function forgetLinkedApplication(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(PARAM);
  window.history.replaceState(window.history.state, '', url);
}
