import { test } from '../crash-guard';
import { createChatClient, createComfortClient, createSubscriptionsClient } from '@platform/api-client';
import { CHILONZOR } from './market-kit';
import { askRide, confirmedSeat, MINUTE, moveTrip, offerOn, SAMARQAND, tomorrow } from './g27-kit';
import { MUROD, ZEBO } from './people';
import { NARROW, openHome, PLATFORMS, shot, t, visit, type Platform } from './screen-tour';
import { signedAs } from './stand-kit';
import { runCron } from './stand-tools';

// Every screen of a passenger with real data (docs/83): Zebo has a seat, a ride that ended, a saved
// driver, a subscription and an offer on her request. Screens open as a person opens them: by taps
// and by the buttons of the bots.
test.use({ viewport: NARROW });
test.describe.configure({ mode: 'serial' });
const HOUR = 60 * MINUTE;
const links: Record<string, string> = {};

test.beforeAll(async () => {
  const { seat, trip } = await confirmedSeat(MUROD, ZEBO);
  links['booking'] = seat.id;
  links['chat'] = seat.chatKey;
  links['trip'] = trip.id;
  const ended = await confirmedSeat(MUROD, ZEBO);
  moveTrip(ended.trip.id, Date.now() - 10 * HOUR, Date.now() - MINUTE);
  await runCron();
  links['review'] = ended.seat.id;
  await createComfortClient(await signedAs('passenger', ZEBO)).save(trip.driver.id);
  const route = { from: CHILONZOR, to: SAMARQAND, woman: false, date: tomorrow() };
  await createSubscriptionsClient(await signedAs('passenger', ZEBO)).subscribe(route);
  links['offer'] = (await offerOn(MUROD, (await askRide(ZEBO)).id)).id;
  links['follow'] = (await createChatClient(await signedAs('passenger', ZEBO)).share(seat.id)).link.slice(
    -43,
  );
});

const byLink = async (platform: Platform, page: Parameters<typeof shot>[0], search: string, name: string) => {
  await openHome(page, 'passenger', ZEBO, platform, search);
  await shot(page, platform, name);
};

for (const platform of PLATFORMS)
  test(`${platform}: home, profile and what is one tap away`, async ({ page }) => {
    await openHome(page, 'passenger', ZEBO, platform);
    await shot(page, platform, 'pa10-home');
    await page.getByLabel(t('account.profile.open')).click();
    await shot(page, platform, 'pa11-profile');
    await visit(page, platform, t('account.delete.open'), 'pa13-delete');
    // The documents and the channels are rows of «Profil» (G65, mockup g65/3, docs/119).
    await visit(page, platform, t('account.profile.documents'), 'pa14-documents');
    await visit(page, platform, t('channels.title'), 'pa15-channels', t('channels.mine.all'));
  });

test('android: every screen a bot button opens', async ({ page }) => {
  await byLink('android', page, `?booking=${links['booking']}`, 'pa20-booking');
  await byLink('android', page, `?chat=${links['chat']}`, 'pa21-chat');
  await byLink('android', page, `?offer=${links['offer']}`, 'pa22-offer');
  await byLink('android', page, `?review=${links['review']}`, 'pa23-review');
  await byLink('android', page, `?complain=${links['review']}`, 'pa24-complaint');
  await byLink('android', page, '?subscriptions=1', 'pa25-subscriptions');
  await byLink('android', page, `?trip=${links['trip']}`, 'pa26-trip');
  await byLink('android', page, `?follow=${links['follow']}`, 'pa27-follow');
});

test('android: «Mening safarlarim» and the saved drivers', async ({ page }) => {
  await openHome(page, 'passenger', ZEBO, 'android');
  await visit(page, 'android', t('common.myTrips'), 'pa30-my-trips');
  // «Sevimli haydovchilar» is a tile of the main screen, its only way in (G76, docs/165).
  await visit(page, 'android', t('comfort.favorites.title'), 'pa31-favorites');
});
