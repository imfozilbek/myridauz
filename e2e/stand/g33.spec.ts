import { expect, test } from '../crash-guard';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { TEXT, publishButton } from '../apps';
import { pressBack, telegramEvents } from '../telegram-mock';
import { confirmedSeat } from './g27-kit';
import * as g33 from './g33-kit';
import { publishTrip, CHILONZOR } from './market-kit';
import { GULNORA, MUROD, SEVARA, SHERZOD, ZEBO } from './people';
import { NARROW, PLATFORMS } from './screen-tour';
import { register } from './seed';
import { searchTo } from './search-kit';
import { openAs, outsideCalls, type Person } from './stand-kit';

const { t } = createI18n(DEFAULT_LOCALE);
const NAVOIY = '1712401';
const DRAFT_BACK = 'Oldingi yozganingiz tiklandi.';
const SLOW_MS = 1500;
const COMMENT = 'Yukxona boʻsh, konditsioner bor';
const { mainButton, shot } = g33;

// G33 (docs/94): «Назад», прокрутка и закрытие on the whole local Rida, Android and iOS. A finding
// first fails here and is shot to before/, the fix makes it green.
test.setTimeout(180_000);
test.use({ viewport: NARROW });
test.afterEach(() => expect(outsideCalls()).toEqual([]));

test('F1, F2. a long list → a trip opens at the top; «Назад» → the same list at the same place', async ({
  context,
}) => {
  for (const person of await g33.tenDrivers()) await publishTrip(person, CHILONZOR, NAVOIY, 'door');
  for (const platform of PLATFORMS) {
    const page = await context.newPage();
    await openAs(page, 'passenger', GULNORA, { platform });
    await mainButton(page).filter({ hasText: TEXT.findTrip }).click();
    await searchTo(page, 'Navoiy');
    await expect(page.locator('.search-trip')).toHaveCount(10);
    await g33.toBottom(page);
    const place = await g33.scrollY(page);
    expect(place).toBeGreaterThan(0);
    await page.locator('.search-trip').last().click();
    // A slow phone network from here: a list loaded again would show its skeleton.
    await page.route(/\/trips\?/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, SLOW_MS));
      await route.continue();
    });
    await expect(page.getByText(TEXT.book)).toBeVisible();
    await shot(page, `f1-trip-${platform}`);
    expect.soft(await g33.scrollY(page), 'F1: the trip opens at the top').toBe(0);
    await pressBack(page);
    await shot(page, `f2-back-${platform}`);
    await expect.soft(page.locator('[aria-busy="true"]'), 'F2: no skeleton').toHaveCount(0, { timeout: 300 });
    await expect(page.locator('.search-trip').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    await shot(page, `f2-results-${platform}`);
    expect.soft(await g33.scrollY(page), 'F2: the same place').toBe(place);
  }
});

const DRAFT_DRIVERS = { android: MUROD, ios: SHERZOD } as const;

test('F3. a new trip half done → the app closes → the draft comes back', async ({ browser }) => {
  for (const platform of PLATFORMS) {
    const page = await g33.phone(browser);
    await openAs(page, 'driver', DRAFT_DRIVERS[platform], { platform });
    await publishButton(page).click();
    await g33.chooseRoute(page);
    // One screen (G63): the way of pickup on it, the comment on its own screen.
    await page.getByText(t('way.trip.mode.door')).click();
    await page.getByText(t('market.publish.comment')).click();
    await page.getByPlaceholder(t('market.comment.placeholder')).fill(COMMENT);
    // Telegram closes the Mini App; the person opens it again later.
    await page.reload();
    await publishButton(page).click();
    await page.waitForLoadState('networkidle');
    await shot(page, `f3-reopened-${platform}`);
    await expect.soft(page.getByText(DRAFT_BACK), 'F3: the draft is back').toBeVisible();
    await expect.soft(page.getByPlaceholder(t('market.comment.placeholder'))).toHaveValue(COMMENT);
  }
});

const CAMERA_PEOPLE = {
  android: { id: 900633, name: 'Akmal', phone: '998901110633' },
  ios: { id: 900634, name: 'Bahrom', phone: '998901110634' },
} as const satisfies Record<string, Person>;

test('F6. the car camera: «Назад» closes the camera, the application stays', async ({ browser }) => {
  for (const platform of PLATFORMS) {
    const page = await g33.phone(browser);
    await register('driver', CAMERA_PEOPLE[platform], 'male');
    await openAs(page, 'driver', CAMERA_PEOPLE[platform], { platform });
    await g33.toCarPhotos(page);
    await page.locator('.photo-tile').first().click();
    await expect(page.getByRole('dialog').getByLabel(TEXT.shutter)).toBeEnabled();
    await shot(page, `f6-camera-${platform}`);
    const back = await telegramEvents(page, 'web_app_setup_back_button');
    expect.soft(back.at(-1)?.['is_visible'], 'F6: «Назад» is shown over the camera').toBe(true);
    await pressBack(page);
    await expect.soft(page.getByRole('dialog'), 'F6: «Назад» closes the camera').toHaveCount(0);
    await expect.soft(page.getByText(TEXT.photoFront).first(), 'F6: the application stays').toBeVisible();
  }
});

const CHATS = { android: [MUROD, SEVARA], ios: [SHERZOD, ZEBO] } as const;

test('F10, F5. the chat stays where the person reads; «Назад» in a call turns the microphone off', async ({
  browser,
}) => {
  for (const platform of PLATFORMS) {
    const [driverPerson, passenger] = CHATS[platform];
    const { seat } = await confirmedSeat(driverPerson, passenger);
    const older = Array.from({ length: 25 }, (_, index) => `Xabar ${index + 1}`);
    const driver = await g33.writeInChat(driverPerson, seat.chatKey, older);
    const page = await g33.phone(browser);
    await g33.countMicrophone(page);
    await openAs(page, 'passenger', passenger, { platform, search: `?chat=${seat.chatKey}` });
    await g33.waitBubbles(page, older.length);
    // The person reads the first messages; the driver writes again.
    await page.evaluate(() => window.scrollTo(0, 0));
    driver.send(JSON.stringify({ type: 'send', text: 'Yangi xabar keldi' }));
    await g33.waitBubbles(page, older.length + 1);
    await shot(page, `f10-chat-reading-${platform}`);
    expect.soft(await g33.scrollY(page), 'F10: the chat does not jump down').toBe(0);
    await page.getByRole('button', { name: t('calls.call') }).click();
    await expect.poll(() => g33.liveMicrophone(page)).toBe(1);
    await pressBack(page);
    await expect
      .configure({ soft: true })
      .poll(() => g33.liveMicrophone(page), { message: 'F5: the microphone is off' })
      .toBe(0);
    driver.close();
  }
});
