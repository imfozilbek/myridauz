import { personIdSchema, type PersonId } from '@platform/contracts';

// The admin bot opens the Mini App on one application: "?application=<public id>" (docs/50, docs/65 A3).
const PARAM = 'application';

export function linkedApplication(): PersonId | null {
  const id = personIdSchema.safeParse(new URLSearchParams(window.location.search).get(PARAM));
  return id.success ? id.data : null;
}

// Once opened, the link is forgotten: going back shows the queue, not the same application again.
export function forgetLinkedApplication(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(PARAM);
  window.history.replaceState(window.history.state, '', url);
}
