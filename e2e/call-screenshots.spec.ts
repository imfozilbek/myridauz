import { expect, test, type Page } from './crash-guard';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { FAKE_MEDIA } from './call-mock';
import { chatSocket } from './chat-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER] = MINI_APPS;
const shot = (page: Page) => async (name: string) => {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `screenshots/call-${name}.png`, fullPage: true });
};

// The screens of G13 for the owner review (docs/33): the call button, a missed call, an answer.
test('passenger: calls the driver, nobody answers; the driver calls back', async ({ page }) => {
  await mockApi(page, 'active');
  await page.route('**/api/calls/*/ice', (route) => route.fulfill({ json: { iceServers: [] } }));
  await page.route('**/api/calls/*/connect', (route) =>
    route.fulfill({ status: 503, json: { error: 'calls.unavailable' } }),
  );
  await page.addInitScript(FAKE_MEDIA);
  const take = shot(page);
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await page.getByText(t('common.myTrips')).click();
  await page.getByText('Jasur').first().click();
  await page.getByText(t('chat.open')).click();
  await expect(page.getByText(t('calls.call'), { exact: true })).toBeVisible();
  await take('1-chat');
  await page.getByText(t('calls.call'), { exact: true }).click();
  await expect(page.getByText(t('calls.calling'))).toBeVisible();
  await take('2-calling');
  await page.getByText(t('calls.hangUp')).click();
  await expect(page.getByText(t('calls.ended.missed'))).toBeVisible();
  await take('3-missed');
  await page.getByText(t('calls.writeChat')).click();
  await expect(page.getByText(t('chat.system.missed_call'))).toBeVisible();
  await take('4-missed-in-chat');
  chatSocket.current?.send(JSON.stringify({ type: 'call', call: { status: 'ringing', caller: 'other' } }));
  await expect(page.getByText(t('calls.incoming'))).toBeVisible();
  await take('5-incoming');
  await page.getByText(t('calls.answer')).click();
  await expect(page.getByText('00:0', { exact: false })).toBeVisible();
  await take('6-talking');
});
