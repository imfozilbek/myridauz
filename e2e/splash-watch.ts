import type { Page } from './crash-guard';

// What the e2e of the splash watch (docs/121 §4, G72).
// Every answer of the API waits this long: the splash stands while the first screen loads.
export async function slowApi(page: Page, ms: number) {
  await page.route('**/api/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    await route.fallback();
  });
}
// The moment the splash left the page, from the tap (performance.now), and every app_ready sent.
export async function watch(page: Page) {
  await page.addInitScript(() => {
    const seen = { stood: false, left: 0 };
    Object.assign(window, { splashSeen: seen });
    new MutationObserver(() => {
      const there = document.getElementById('splash') !== null;
      if (there) seen.stood = true;
      else if (seen.stood && !seen.left) seen.left = performance.now();
    }).observe(document, { childList: true, subtree: true });
  });
  const ready: Record<string, unknown>[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'POST' || !request.url().includes('/analytics')) return;
    const { events = [] } = request.postDataJSON() as { events?: Record<string, unknown>[] };
    ready.push(...events.filter((event) => event['name'] === 'app_ready'));
  });
  return ready;
}
export const leftAt = (page: Page) =>
  page.evaluate(() => (window as unknown as { splashSeen: { left: number } }).splashSeen.left);
