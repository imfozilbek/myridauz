import { loadBrand } from '@platform/brands';
import { expect, test, type Page } from '../crash-guard';
import { TEXT } from '../apps';
import { addFace, passConsent } from '../registration';
import { applyAsDriver } from '../driver-application';
import { say, type Reply } from './bot-kit';
import { answered, beforeStart, DRIVER_BOT } from './first-contact-kit';
import { toldBy } from './g27-kit';
import { mainButton, NARROW, openHome, PLATFORMS, t, type Platform } from './screen-tour';
import { outsideCalls, type Person } from './stand-kit';

// The first contact of a driver (docs/95, G34): the bot before and after «Start», then the Mini App
// from its button up to the sent application and the answer of the bot. Every screen is shot.
test.use({ viewport: NARROW });
test.afterEach(() => expect(outsideCalls()).toEqual([]));

const MALE = t('account.gender.male');
const RECEIVED = 'Arizangiz qabul qilindi.';
const NEWCOMERS: Record<Platform, Person> = {
  android: { id: 900791, name: 'Rustam', phone: '998901110791' },
  ios: { id: 900792, name: 'Jasur', phone: '998901110792' },
};

async function shot(page: Page, name: string) {
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.screenshot({
    path: `screenshots/stand/first-contact/driver/${name}.png`,
    animations: 'disabled',
  });
}

const buttonsOf = (reply: Reply) => reply.reply_markup?.inline_keyboard?.flat().map((button) => button.text);

test('the driver bot: before «Start», the welcome, from the passenger bot, any other text', async ({
  page,
}) => {
  await beforeStart(page, DRIVER_BOT, t('bot.profile.driver.description'));
  await shot(page, '01-bot-before-start');
  const welcome = await say('driver', NEWCOMERS.android, '/start');
  expect(welcome.photo).toMatch(/\/bot\/driver-welcome\.png$/u);
  expect(welcome.caption).toMatch(/500\s000/u);
  expect(buttonsOf(welcome)).toEqual([t('bot.open')]);
  await answered(page, DRIVER_BOT, '/start', welcome);
  await shot(page, '02-bot-after-start');
  const fromPassenger = await say('driver', NEWCOMERS.ios, '/start from_passenger');
  expect(fromPassenger.caption).toContain(t('bot.driver.helloFromPassenger', { brand: loadBrand().name }));
  await answered(page, DRIVER_BOT, '/start', fromPassenger);
  await shot(page, '02-bot-from-passenger');
  const other = await say('driver', NEWCOMERS.android, 'Salom, qanday ishlaydi?');
  expect(buttonsOf(other)).toEqual([t('bot.open'), t('bot.help')]);
  await answered(page, DRIVER_BOT, 'Salom, qanday ishlaydi?', other);
  await shot(page, '02-bot-any-text');
});

for (const platform of PLATFORMS)
  test(`${platform}: «Ochish» → two screens → the application sent → the bot answers`, async ({ page }) => {
    const person = NEWCOMERS[platform];
    await openHome(page, 'driver', person, platform);
    await expect(mainButton(page)).toHaveText(TEXT.continue);
    await expect(page.getByText(TEXT.offerLink)).toBeVisible();
    await shot(page, `${platform}/03-welcome`);
    await passConsent(page, () => shot(page, `${platform}/03-welcome-ticked`));
    await expect(page.getByRole('textbox')).toHaveValue(person.name);
    await page.getByRole('radio', { name: MALE }).click();
    await addFace(page);
    await expect(mainButton(page)).toHaveText(TEXT.sendPhone);
    await shot(page, `${platform}/04-about`);
    await mainButton(page).click();
    // No application yet: the main screen with the big tile «Haydovchi boʻlish», then the application.
    await applyAsDriver(page, (name) => shot(page, `${platform}/05-${name}`));
    const told = await toldBy('driver', person, RECEIVED);
    if (platform === 'android') {
      await answered(page, DRIVER_BOT, t('drivers.send'), { text: told });
      await shot(page, '09-bot-received');
    }
  });
