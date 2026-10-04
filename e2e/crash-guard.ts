import { test as base, expect } from '@playwright/test';

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
export const test = base.extend<{ crashGuard: undefined }>({
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
