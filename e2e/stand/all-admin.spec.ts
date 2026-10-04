import { test } from '../crash-guard';
import { createFeedbackClient } from '@platform/api-client';
import { confirmedSeat } from './g27-kit';
import { MUROD, NARGIZA, OWNER, SHERZOD } from './people';
import { NARROW, openHome, PLATFORMS, shot, t, visit, type Platform } from './screen-tour';
import { apply } from './seed';
import { signedAs, type Person } from './stand-kit';
import type { Page } from '@playwright/test';

// Every screen of the team (docs/79, docs/83): an application waits, a complaint waits, and every
// tool of «Boshqaruv» opens with real data. Nothing is decided: the walk only looks.
test.use({ viewport: NARROW });
test.describe.configure({ mode: 'serial' });
const APPLICANT: Person = { id: 900705, name: 'Sobir', phone: '998901110705' };

test.beforeAll(async () => {
  await apply(APPLICANT, '01T789UV', 'male');
  const { seat } = await confirmedSeat(SHERZOD, NARGIZA);
  await createFeedbackClient(await signedAs('passenger', NARGIZA)).complain({
    bookingId: seat.id,
    reason: 'price_changed',
  });
});

const open = async (page: Page, platform: Platform, label: string, name: string) => {
  await page.getByText(label).first().click();
  await shot(page, platform, name);
};

test('android: an application, its plate check and the reasons', async ({ page }) => {
  await openHome(page, 'admin', OWNER, 'android');
  await open(page, 'android', t('common.admin.applications'), 'ta10-queue');
  await open(page, 'android', APPLICANT.name, 'ta11-application');
  await visit(page, 'android', t('moderation.approve'), 'ta12-plate-check');
  await visit(page, 'android', t('moderation.requestChanges'), 'ta13-reasons');
});

test('android: a complaint', async ({ page }) => {
  await openHome(page, 'admin', OWNER, 'android');
  await open(page, 'android', t('common.admin.complaints'), 'ta20-complaints');
  await open(page, 'android', SHERZOD.name, 'ta21-complaint');
});

const management = async (page: Page, platform: Platform) => {
  await openHome(page, 'admin', OWNER, platform);
  await page.getByText(t('common.admin.management')).first().click();
};

for (const platform of PLATFORMS)
  test(`${platform}: «Boshqaruv», trips, numbers and prices`, async ({ page }) => {
    await management(page, platform);
    await shot(page, platform, 'ta30-management');
    await visit(page, platform, t('common.admin.trips'), 'ta31-trips');
    await visit(page, platform, t('common.admin.statistics'), 'ta32-stats');
    await open(page, platform, t('pricing.title'), 'ta33-pricing');
    await open(page, platform, t('pricing.edit'), 'ta34-pricing-edit');
    await open(page, platform, t('pricing.preview'), 'ta35-pricing-preview');
  });

// Each tool from «Boshqaruv» on its own page: «Back» from a tool goes to the main screen.
const tools: readonly [string, string, string, string][] = [
  [t('wallet.team.title'), 'ta36-wallets', MUROD.name, 'ta37-wallet-adjust'],
  [t('channels.title'), 'ta38-channels', t('channels.add'), 'ta39-channel-edit'],
  [t('pitaks.title'), 'ta40-pitaks', t('pitaks.add'), 'ta41-pitak-edit'],
];
for (const [tool, toolShot, inside, insideShot] of tools)
  test(`android: ${toolShot}`, async ({ page }) => {
    await management(page, 'android');
    await open(page, 'android', tool, toolShot);
    await visit(page, 'android', inside, insideShot);
  });

test('android: a hand correction of a wallet', async ({ page }) => {
  await management(page, 'android');
  await page.getByText(t('wallet.team.title')).first().click();
  await page.getByText(MUROD.name).first().click();
  await open(page, 'android', t('wallet.adjust.title'), 'ta45-wallet-adjust-form');
});

test('android: the hand price of one direction', async ({ page }) => {
  await management(page, 'android');
  await page.getByText(t('pricing.title')).first().click();
  await page.getByText('Samarqand viloyati').first().click();
  await shot(page, 'android', 'ta46-direction');
});

test('android: the history of pitaks', async ({ page }) => {
  await management(page, 'android');
  await page.getByText(t('pitaks.title')).first().click();
  await visit(page, 'android', t('pitaks.history'), 'ta42-pitak-history');
});
