import type { Page, WebSocketRoute } from '@playwright/test';

// The personal channel (docs/64, G19): a ticket and a socket the test drives.
export async function mockFeed(page: Page) {
  const sockets: WebSocketRoute[] = [];
  await page.route('**/api/feed/ticket', (route) =>
    route.fulfill({ json: { url: 'ws://feed.test/feed/socket?ticket=t' } }),
  );
  await page.routeWebSocket('**/feed/socket**', (socket) => void sockets.push(socket));
  // "Something changed" to every open Mini App of this page.
  const changed = () => sockets.forEach((socket) => socket.send(JSON.stringify({ type: 'changed' })));
  return { sockets, changed };
}
