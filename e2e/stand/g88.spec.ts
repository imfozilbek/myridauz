import { MY_TRIP_LINK } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { loadBrand } from '../../brands/index';
import { afterSplash, expect, test } from '../crash-guard';
import { telegramEvents } from '../telegram-mock';
import { confirmedSeat } from './g27-kit';
import { phone } from './g33-kit';
import { PLATFORMS } from './screen-tour';
import { approvedDriver, register } from './seed';
import { openAs, outsideCalls, type Person } from './stand-kit';
import { botMessages, preparedCards, standSql } from './stand-tools';

// G88 (docs/193) on the whole local Rida, Android and iOS: the driver sends the ready card of the trip
// with its picture and the code (loop trip), the bot card sends the same words, the story carries the
// code (loop story); a new driver's moment story and QR; «Yana ulashish» of a passenger. The pictures
// and the words go to screenshots/stand/g88/ for the owner (docs/33).
const { t } = createI18n(DEFAULT_LOCALE);
const brand = loadBrand().name;
const OUT = 'screenshots/stand/g88';
// The words of a story of an ordinary account (Telegram): at most 200 signs.
const STORY_WORDS = 200;
const WALKS = {
  android: {
    driver: { id: 900880, name: 'Jamshid', phone: '998901110880' },
    plate: '01T880UV',
    passenger: { id: 900881, name: 'Malika', phone: '998901110881' },
    fresh: { id: 900882, name: 'Otabek', phone: '998901110882' },
    freshPlate: '01T882UV',
  },
  ios: {
    driver: { id: 900883, name: 'Bobur', phone: '998901110883' },
    plate: '01T883UV',
    passenger: { id: 900884, name: 'Nigora', phone: '998901110884' },
    fresh: { id: 900885, name: 'Sherzod', phone: '998901110885' },
    freshPlate: '01T885UV',
  },
} as const;
const keeping = process.env['STAND_SHOTS'] !== 'off';
const keep = (name: string, body: string | Uint8Array) => {
  if (!keeping) return;
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/${name}`, body);
};
const keepPicture = async (name: string, url: string) =>
  keep(name, new Uint8Array(await (await fetch(url)).arrayBuffer()));
const shot = async (page: Page, name: string) => {
  await afterSplash(page);
  await page.screenshot({ path: `${OUT}/${name}.png`, animations: 'disabled' });
};
const cardOf = async (part: string) =>
  (await preparedCards()).findLast((card) => JSON.stringify(card).includes(part));
// The words of the card a tap made: a new one after the cards kept before it.
async function newWords(tap: () => Promise<void>): Promise<string> {
  const before = (await preparedCards()).length;
  await tap();
  await expect.poll(async () => (await preparedCards()).length).toBeGreaterThan(before);
  const content = (await preparedCards()).at(-1)?.['input_message_content'] as { message_text?: string };
  return content.message_text ?? '';
}
const uncelebrate = (person: Person) => standSql(`DELETE FROM share_moments WHERE user_id = ${person.id}`);

test.setTimeout(240_000);
test.afterEach(() => expect(outsideCalls()).toEqual([]));

test('the driver: the card of the trip in the bot and the app, and the story', async ({ browser }) => {
  for (const platform of PLATFORMS) {
    const { driver, plate, passenger } = WALKS[platform];
    await approvedDriver(driver, plate);
    await register('passenger', passenger, 'female');
    const { trip } = await confirmedSeat(driver, passenger);
    // The live card of the driver bot: «🔗 Havolani yuborish» carries the words and the code.
    const shared = (await botMessages())
      .flatMap((message) => message.buttons)
      .findLast((button) => (button.url ?? '').includes(encodeURIComponent(`trip_${trip.id}__trip-`)));
    const words = new URL(shared?.url ?? 'https://t.me').searchParams.get('text') ?? '';
    expect(words).toMatch(/^Safarimda \d ta boʻsh joy bor\n🟢 .+\n🔴 .+\n🗓 .+\n💰 Bir joy .+\n\n.+$/u);
    keep(`1-bot-words-${platform}.txt`, words);
    const page = await phone(browser);
    await openAs(page, 'driver', driver, { platform, search: `?${MY_TRIP_LINK}=${trip.id}` });
    await page.getByText(t('driverTrip.channel.share')).click();
    await expect.poll(async () => (await cardOf(`trip_${trip.id}__trip-`))?.['type']).toBe('photo');
    const card = await cardOf(`trip_${trip.id}__trip-`);
    expect(String(card?.['caption'])).toBe(words);
    await keepPicture(`2-trip-card-${platform}.jpg`, String(card?.['photo_url']));
    await shot(page, `2-my-trip-${platform}`);
    await page.getByText(t('driverTrip.tile.story')).click();
    await expect.poll(async () => (await telegramEvents(page, 'web_app_share_to_story')).length).toBe(1);
    const [story] = await telegramEvents(page, 'web_app_share_to_story');
    const caption = String(story?.['text']);
    expect(caption.length).toBeLessThanOrEqual(STORY_WORDS);
    expect(caption).toMatch(new RegExp(`trip_${trip.id}__story-[a-z0-9]{6}$`, 'u'));
    keep(`3-story-words-${platform}.txt`, caption);
    await keepPicture(`3-story-${platform}.jpg`, String(story?.['media_url']));
    await page.context().close();
  }
});

test('a new driver: the story of the moment and the QR on the glass', async ({ browser }) => {
  for (const platform of PLATFORMS) {
    const { fresh, freshPlate } = WALKS[platform];
    await approvedDriver(fresh, freshPlate);
    uncelebrate(fresh);
    const page = await phone(browser);
    await openAs(page, 'driver', fresh, { platform });
    await expect(page.getByText(t('growth.title.driver', { brand }))).toBeVisible();
    await page.getByText(t('growth.toStory')).click();
    await expect.poll(async () => (await telegramEvents(page, 'web_app_share_to_story')).length).toBe(1);
    const [story] = await telegramEvents(page, 'web_app_share_to_story');
    await keepPicture(`4-moment-story-${platform}.jpg`, String(story?.['media_url']));
    const moment = await newWords(() => page.getByText(t('growth.toRiders')).click());
    expect(moment).toContain(fresh.name);
    keep(`4-moment-words-${platform}.txt`, moment);
    await page.getByRole('button', { name: t('growth.later') }).click();
    await page.getByText(fresh.name).first().click();
    await page.getByText(t('growth.qr.title')).click();
    await page.getByText(t('growth.qr.download')).click();
    await expect
      .poll(async () => (await telegramEvents(page, 'web_app_request_file_download')).length)
      .toBe(1);
    const [file] = await telegramEvents(page, 'web_app_request_file_download');
    await keepPicture(`5-qr-${platform}.png`, String(file?.['url']));
    await page.context().close();
  }
});

test('a passenger: «Yana ulashish» sends the ready card', async ({ browser }) => {
  for (const platform of PLATFORMS) {
    const { passenger } = WALKS[platform];
    const page = await phone(browser);
    await openAs(page, 'passenger', passenger, { platform });
    await page.getByText(passenger.name).first().click();
    await page.getByRole('button', { name: new RegExp(`^${t('growth.impact.title')}`, 'u') }).click();
    const again = await newWords(() => page.getByText(t('growth.impact.share')).click());
    expect(again).toContain(t('share.value.passenger'));
    keep(`6-again-words-${platform}.txt`, again);
    await page.context().close();
  }
});
