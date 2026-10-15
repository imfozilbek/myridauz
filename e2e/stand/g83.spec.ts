import { createWaitlistClient } from '@platform/api-client';
import { loadBrand } from '@platform/brands';
import { expect, type Page } from '@playwright/test';
import { test } from '../crash-guard';
import { showChat } from './bot-chat';
import { say } from './bot-kit';
import { answered, type Bot } from './first-contact-kit';
import { OWNER } from './people';
import { mainButton, openHome, shot, t } from './screen-tour';
import { signedAs, type Person } from './stand-kit';
import { botMessages, clearBotMessages, standSql } from './stand-tools';

// The waitlist of G83 on the whole system (docs/181): the main bot, the questionnaire, the card of the
// bot, «Kutayotganlar» of the team, the opening of the direction with its ring, the switch.
const AZIZ: Person = { id: 900831, name: 'Aziz', phone: '998901110831' };
const JASUR: Person = { id: 900832, name: 'Jasur', phone: '998901110832' };
const LATE: Person = { id: 900833, name: 'Sanjar', phone: '998901110833' };
const SAMARQAND = '1718';
const brand = loadBrand();
const MAIN_BOT: Bot = {
  name: t('bot.profile.main.name', { brand: brand.name }),
  avatar: 'bot-main-avatar.png',
  picture: '',
};
const ROUTE = t('waitlist.route.pair', { from: 'Toshkent shahri', to: 'Samarqand viloyati' });
const OUT = 'screenshots/stand/g83';

const chatShot = async (page: Page, person: Person, name: string) => {
  const mine = (await botMessages()).filter((one) => one.bot === 'main' && one.chatId === person.id);
  await showChat(page, MAIN_BOT, mine);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  return mine;
};
const tap = (page: Page, name: string | RegExp) => page.getByRole('button', { name }).first().click();

test.beforeEach(() => {
  const people = [AZIZ, JASUR, LATE].map((person) => person.id).join(',');
  standSql(`DELETE FROM waitlist WHERE telegram_id IN (${people})`);
  standSql(`DELETE FROM waitlist_visits WHERE telegram_id IN (${people})`);
  standSql(`DELETE FROM waitlist_openings WHERE region = '${SAMARQAND}'`);
  standSql(`DELETE FROM switches`);
});

test('G83. both sides write their direction, the team opens it, the bot rings', async ({ page, context }) => {
  // Each app and the drawn chat on its own page: one Telegram of the stand per page.
  const [chat, team] = [await context.newPage(), await context.newPage()];
  await clearBotMessages();
  const welcome = await say('main', AZIZ, '/start site');
  expect(welcome.caption).toContain(t('bot.main.hello', { name: AZIZ.name }));
  await answered(chat, MAIN_BOT, '/start', welcome);
  await chat.screenshot({ path: `${OUT}/1-bot-welcome.png`, fullPage: true });

  await openHome(page, 'main', AZIZ, 'android');
  await shot(page, 'android', 'g83-1-role');
  await tap(page, new RegExp(`^${t('waitlist.role.passenger')}`, 'u'));
  await page.getByRole('checkbox').first().click();
  await shot(page, 'android', 'g83-2-pains');
  await mainButton(page).click();
  await tap(page, 'Samarqand viloyati');
  await shot(page, 'android', 'g83-3-when');
  await tap(page, t('waitlist.cadence.weekly'));
  await expect(page.getByText(t('waitlist.channels.title'))).toBeVisible();
  await shot(page, 'android', 'g83-4-channels');
  await mainButton(page).click();
  await expect(page.getByText(t('waitlist.done.title'))).toBeVisible();
  await shot(page, 'android', 'g83-5-result');
  await expect.poll(async () => (await chatShot(chat, AZIZ, '2-bot-card')).length).toBeGreaterThan(0);

  const driver = createWaitlistClient(await signedAs('main', JASUR));
  await driver.open(null, null);
  await driver.save({
    role: 'driver',
    pains: ['empty'],
    home: SAMARQAND,
    region: SAMARQAND,
    cadence: 'daily',
  });

  await openHome(team, 'admin', OWNER, 'android');
  await team.getByText(t('common.admin.management')).first().click();
  await team.getByText(t('common.admin.statistics')).first().click();
  await expect(team.getByText(t('waitlistTeam.waiting')).first()).toBeVisible();
  await shot(team, 'android', 'g83-6-team-stats');
  await team.getByText(ROUTE).first().click();
  await shot(team, 'android', 'g83-7-direction');
  await expect(mainButton(team)).toHaveText(t('waitlistTeam.open'));
  await mainButton(team).click();
  await expect(team.getByText(t('waitlistTeam.openAsk'))).toBeVisible();
  await expect(mainButton(team)).toHaveText(t('waitlistTeam.openYes'));
  await mainButton(team).click();
  await expect(team.getByText(/^Ochildi/u)).toBeVisible();
  await shot(team, 'android', 'g83-8-opened');
  await expect
    .poll(async () => (await chatShot(chat, AZIZ, '3-bot-opened')).some((one) => one.replyTo !== null), {
      timeout: 15_000,
    })
    .toBe(true);
  const rings = await botMessages();
  expect(rings.some((one) => one.bot === 'main' && one.chatId === JASUR.id)).toBe(true);
});

test('G83. the owner closes the list: a new person gets the bots of the trips', async ({ page }) => {
  await openHome(page, 'admin', OWNER, 'android');
  await page.getByText(t('common.admin.management')).first().click();
  // The visible switch inside its label, as a finger taps it: the box itself is hidden.
  const box = page.getByRole('checkbox', { name: t('waitlistTeam.switch') });
  await expect(box).toBeChecked();
  await box.locator('xpath=ancestor::label[1]').click();
  await expect(page.getByText(t('waitlistTeam.closeAsk'))).toBeVisible();
  await expect(mainButton(page)).toHaveText(t('waitlistTeam.closeYes'));
  await mainButton(page).click();
  await expect(page.getByText(/^Yopiq/u)).toBeVisible();
  await shot(page, 'android', 'g83-9-closed');
  const welcome = await say('main', LATE, '/start');
  const buttons = (welcome.reply_markup?.inline_keyboard ?? []).flat().map((button) => button.text);
  expect(buttons).toContain(t('bot.main.find'));
  await answered(page, MAIN_BOT, '/start', welcome);
  await page.screenshot({ path: `${OUT}/4-bot-closed.png`, fullPage: true });
  standSql(`DELETE FROM switches`);
});
