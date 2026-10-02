import { expect, test, type Page } from '@playwright/test';
import { TEXT } from '../apps';
import { say } from './bot-kit';
import { afterStart, beforeStart, DRIVER_BOT } from './first-contact-kit';
import { mainButton, NARROW, openHome, PLATFORMS, t, type Platform } from './screen-tour';
import { outsideCalls, type Person } from './stand-kit';

// The first contact of a driver (docs/95): the bot before and after «Start», then the Mini App from
// its button up to the first step of the driver application. Every screen is shot, as the person sees it on the phone.
test.use({ viewport: NARROW });
test.afterEach(() => expect(outsideCalls()).toEqual([]));

const MALE = t('account.gender.male');
const NEWCOMERS: Record<Platform, Person> = {
  android: { id: 900701, name: 'Rustam', phone: '998901110701' },
  ios: { id: 900702, name: 'Jasur', phone: '998901110702' },
};

async function shot(page: Page, name: string) {
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.screenshot({
    path: `screenshots/stand/first-contact/driver/${name}.png`,
    animations: 'disabled',
  });
}

test('the driver bot: before and after «Start»', async ({ page }) => {
  await beforeStart(page, DRIVER_BOT, t('bot.profile.driver.description'));
  await shot(page, '01-bot-before-start');
  const reply = await say('driver', NEWCOMERS.android, '/start');
  expect(reply.reply_markup?.inline_keyboard?.flat().map((button) => button.text)).toEqual([t('bot.open')]);
  await afterStart(page, DRIVER_BOT, reply);
  await shot(page, '02-bot-after-start');
});

for (const platform of PLATFORMS)
  test(`${platform}: «Ochish» → the Mini App up to the driver application`, async ({ page }) => {
    const person = NEWCOMERS[platform];
    await openHome(page, 'driver', person, platform);
    await expect(mainButton(page)).toHaveText(TEXT.continue);
    await shot(page, `${platform}/03-welcome`);
    await mainButton(page).click();
    await expect(mainButton(page)).toHaveText(TEXT.accept);
    await shot(page, `${platform}/04-consent`);
    await mainButton(page).click();
    await expect(page.getByPlaceholder('Ism')).toHaveValue(person.name);
    await shot(page, `${platform}/05-name`);
    await mainButton(page).click();
    await expect(page.getByText(MALE, { exact: true })).toBeVisible();
    await shot(page, `${platform}/06-gender`);
    await page.getByText(MALE, { exact: true }).click();
    await expect(mainButton(page)).toHaveText(TEXT.sendPhone);
    await shot(page, `${platform}/07-phone`);
    await mainButton(page).click();
    await expect(page.getByText(TEXT.becomeDriver).first()).toBeVisible();
    // No application yet: the driver lands on its first step, not on the main screen.
    await expect(mainButton(page)).toHaveText(t('drivers.intro.start'));
    await shot(page, `${platform}/08-application-intro`);
  });
