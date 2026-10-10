import { expect, test } from '../crash-guard';
import { createFeedbackClient } from '@platform/api-client';
import { confirmedSeat } from './g27-kit';
import { KAMRON, MUROD, NARGIZA, OWNER, SHERZOD } from './people';
import { NARROW, openHome, PLATFORMS, shot, t, visit, type Platform } from './screen-tour';
import { apply } from './seed';
import { signedAs, type Person } from './stand-kit';
import { standSql } from './stand-tools';
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
    reasons: ['price_changed'],
  });
});

const open = async (page: Page, platform: Platform, label: string, name: string) => {
  await page.getByText(label).first().click();
  await shot(page, platform, name);
};

test('android: an application, its plate check and the reasons', async ({ page }) => {
  await openHome(page, 'admin', OWNER, 'android');
  await shot(page, 'android', 'ta10-navbat');
  await open(page, 'android', t('team.case.application', { name: APPLICANT.name }), 'ta11-application');
  await visit(page, 'android', t('moderation.approve'), 'ta12-plate-check');
  await visit(page, 'android', t('moderation.requestChanges'), 'ta13-reasons');
});

test('android: a complaint', async ({ page }) => {
  await openHome(page, 'admin', OWNER, 'android');
  await open(page, 'android', t('team.filter.complaint'), 'ta20-complaints');
  await open(
    page,
    'android',
    t('team.case.complaint', { name: NARGIZA.name, against: SHERZOD.name }),
    'ta21-complaint',
  );
});

const management = async (page: Page, platform: Platform) => {
  await openHome(page, 'admin', OWNER, platform);
  await page.getByText(t('common.admin.management')).first().click();
};

for (const platform of PLATFORMS)
  test(`${platform}: «Boshqaruv», trips, numbers and prices`, async ({ page }) => {
    await management(page, platform);
    await shot(page, platform, 'ta30-management');
    // Exactly «Safarlar»: the group «Odamlar va safarlar» has the word too.
    await visit(page, platform, new RegExp(`^${t('common.admin.trips')}$`, 'u'), 'ta31-trips');
    await visit(page, platform, t('common.admin.statistics'), 'ta32-stats');
    await open(page, platform, t('pricing.title'), 'ta33-pricing');
    await open(page, platform, t('pricing.edit'), 'ta34-pricing-edit');
    await open(page, platform, t('pricing.preview'), 'ta35-pricing-preview');
  });

// Each tool from «Boshqaruv» on its own page: «Back» from a tool goes to the main screen.
const tools: readonly [string, string, string, string][] = [
  [t('manage.people'), 'ta47-people', t('manage.person.search'), 'ta48-people-search'],
  [t('manage.team'), 'ta49-team', t('manage.teamAdd'), 'ta50-team-add'],
  [t('manage.limits'), 'ta51-limits', t('manage.limit.schedule.maxActiveTrips'), 'ta52-limit-edit'],
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

test('android: the journal of the team', async ({ page }) => {
  await management(page, 'android');
  await open(page, 'android', t('manage.journal'), 'ta53-journal');
});

test('android: the history of pitaks', async ({ page }) => {
  await management(page, 'android');
  await page.getByText(t('pitaks.title')).first().click();
  await visit(page, 'android', t('pitaks.history'), 'ta42-pitak-history');
});

// A moderator reads «Statistika» and «Kanallar» and changes nothing (owner decision 06.10.2026,
// docs/120): no «Kanal qoʻshish» on the list.
test('android: a moderator reads the channels', async ({ page }) => {
  standSql(
    `INSERT OR IGNORE INTO team_members (user_id, role, added_by, added_at) VALUES (${KAMRON.id}, 'moderator', ${OWNER.id}, ${Date.now()})`,
  );
  await openHome(page, 'admin', KAMRON, 'android');
  await visit(page, 'android', t('common.admin.statistics'), 'ta54-moderator-stats');
  await page.getByText(t('channels.title'), { exact: true }).first().click();
  await expect(page.getByText(t('channels.fixed')).first()).toBeVisible();
  await expect(page.getByText(t('channels.add'))).toHaveCount(0);
  await shot(page, 'android', 'ta55-moderator-channels');
});
