import type { PublicWaitlist } from '@platform/contracts';

type Fetch = (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

// The buttons of the site lead to the main bot while the list of waiting is open (G83, docs/181).
// When the owner closes it, the buttons into the trips built next to them show instead. Without an
// answer the page stays as it was built: the main bot answers a closed list with the trips too.
export async function initList(root: HTMLElement, load: Fetch = (url) => fetch(url)) {
  try {
    const response = await load(root.dataset['waitlist'] ?? '');
    if (!response.ok || ((await response.json()) as PublicWaitlist).open) return;
  } catch {
    // No internet for a moment: the buttons of the list stay.
    return;
  }
  for (const button of root.querySelectorAll<HTMLElement>('[data-list]')) button.hidden = true;
  for (const button of root.querySelectorAll<HTMLElement>('[data-trips]')) button.hidden = false;
}
