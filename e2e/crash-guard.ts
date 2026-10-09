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
// A picture of a screen waits until the splash has left (docs/121 §4, G72): it is the screen people
// see after it. A test of the splash itself shoots its element.
export const afterSplash = (page: Page) => page.locator('#splash').waitFor({ state: 'detached' });
const pictureAfterSplash = (page: Page) => {
  const shoot = page.screenshot.bind(page);
  page.screenshot = async (options) => {
    await afterSplash(page);
    return shoot(options);
  };
};
// The sheet of the open Mini App (G68, docs/155) rises over the main screen when something waits for
// an answer. A test of another step answers «later» the way a person may: a tap beside each sheet.
// A test of the sheets themselves keeps them: test.use({ actionSheets: 'keep' }).
const SHEET = '.action-sheet';
const MOST_SHEETS = 10;
const laterOnSheets = (page: Page) =>
  page.addLocatorHandler(page.locator(SHEET).first(), async () => {
    for (let left = MOST_SHEETS; left > 0 && (await page.locator(SHEET).count()) > 0; left -= 1)
      await page.keyboard.press('Escape');
  });

export const test = base.extend<{
  crashGuard: undefined;
  pictures: undefined;
  actionSheets: 'later' | 'keep';
  sheetsLater: undefined;
}>({
  actionSheets: ['later', { option: true }],
  sheetsLater: [
    async ({ context, actionSheets }, use) => {
      if (actionSheets === 'later') {
        await Promise.all(context.pages().map(laterOnSheets));
        context.on('page', (page) => void laterOnSheets(page));
      }
      await use(undefined);
    },
    { auto: true },
  ],
  pictures: [
    async ({ context }, use) => {
      const prepare = process.env['STAND_SHOTS'] === 'off' ? noPicture : pictureAfterSplash;
      context.pages().forEach(prepare);
      context.on('page', prepare);
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
