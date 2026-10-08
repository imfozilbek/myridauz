import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { BrowserContext } from '@playwright/test';
import { expect, test, type Page } from './crash-guard';
import { openBoard, type Board } from './g64-requests-mock';
import { openDriverTalk, type Talk } from './g64-talk-mock';
import { openPassengerTalk } from './g64-talk-passenger';
import { openMyTrips, openPrivateTrip } from './g64-trips-mock';
import { HEIGHT, nothingCut, oneHeight, oneSize, WIDTHS } from './sizes';

const { t } = createI18n(DEFAULT_LOCALE);

// docs/121 on narrow and wide phones (G64): «Yoʻlovchilar soʻrovlari» with its sheets, the talk
// before a booking in the chat and the call, «Mening safarlarim» and the trip of a whole car. Nothing
// is cut; the days, the tools of a card and the days of the week are of one size each; the times are
// as wide as their words on the mockup g64/1, of one height.
const look = (page: Page, name: string, width: number) =>
  page.screenshot({ path: `screenshots/look/g64-${name}-${width}.png`, fullPage: true });

// Each screen opens on a phone of its own: the app keeps the place of the last one (docs/94 F2).
async function phone(context: BrowserContext, width: number) {
  const page = await context.newPage();
  await page.setViewportSize({ width, height: HEIGHT });
  return page;
}

const BOARDS: readonly Board[] = ['today', 'trip', 'salon'];
const TALKS: readonly Talk[] = ['trip', 'sent', 'call'];

for (const width of WIDTHS) {
  test(`${width}px: the boards and their sheets fit`, async ({ context }) => {
    for (const board of BOARDS) {
      const page = await phone(context, width);
      await openBoard(page, board);
      await nothingCut(page);
      await oneSize(page, '.request-tool');
      if (board === 'today') await oneSize(page, '.day-count');
      await look(page, `board-${board}`, width);
    }
    const page = await phone(context, width);
    await openBoard(page, 'salon');
    await page.locator('.request-row', { hasText: 'Sardor' }).getByText(t('requests.action.salon')).click();
    await expect(page.getByRole('dialog').locator('.time-chip').first()).toBeVisible();
    await nothingCut(page);
    await oneHeight(page, '.time-chip');
    await look(page, 'salon-sheet', width);
  });

  test(`${width}px: the talk in the chat and the call fits`, async ({ context }) => {
    for (const talk of TALKS) {
      const page = await phone(context, width);
      await openDriverTalk(page, talk);
      await nothingCut(page);
      await look(page, `talk-${talk}`, width);
    }
    const page = await phone(context, width);
    await openPassengerTalk(page);
    await nothingCut(page);
    await look(page, 'talk-passenger', width);
  });

  test(`${width}px: «Mening safarlarim» and the trip of a whole car fit`, async ({ context }) => {
    const page = await phone(context, width);
    await openMyTrips(page);
    await page.getByText('2 150 000').waitFor();
    await nothingCut(page);
    await oneSize(page, '.week-day');
    await look(page, 'my-trips', width);
    const other = await phone(context, width);
    await openPrivateTrip(other);
    await nothingCut(other);
    await look(other, 'private-trip', width);
  });
}
