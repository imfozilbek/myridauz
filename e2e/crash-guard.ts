import { test as base, expect, type Page } from '@playwright/test';

export { expect, type Locator, type Page } from '@playwright/test';

type Sent = { readonly events?: readonly Record<string, unknown>[] };
const eventsOf = (body: string): readonly Record<string, unknown>[] => {
  try {
    return (JSON.parse(body) as Sent).events ?? [];
  } catch {
    return [];
  }
};

// A screen that broke fails the test (G52, lesson 122): the error screen looks like any other
// screen to a test, so every Mini App of a test is watched for client_error, as people see it.
// The stand checks without pictures unless asked (G71): a picture of a phone screen costs the processor
// more than the step before it. pnpm stand:check --shots takes them again; the waits before stay.
const noPicture = (page: Page) => {
  page.screenshot = async () => Buffer.alloc(0);
};
export const test = base.extend<{ crashGuard: undefined; pictures: undefined }>({
  pictures: [
    async ({ context }, use) => {
      if (process.env['STAND_SHOTS'] === 'off') {
        context.pages().forEach(noPicture);
        context.on('page', noPicture);
      }
      await use(undefined);
    },
    { auto: true },
  ],
  crashGuard: [
    async ({ context }, use) => {
      const crashes: string[] = [];
      context.on('request', (request) => {
        if (request.method() !== 'POST' || !request.url().includes('/analytics')) return;
        for (const event of eventsOf(request.postData() ?? ''))
          if (event['name'] === 'client_error')
            crashes.push([event['screen'], event['code'], event['error'], event['detail']].join(' '));
      });
      await use(undefined);
      expect(crashes, 'a screen of the Mini App broke (client_error)').toEqual([]);
    },
    { auto: true },
  ],
});
