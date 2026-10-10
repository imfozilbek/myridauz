import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Page } from '@playwright/test';

const { t } = createI18n(DEFAULT_LOCALE);

// Each Mini App is built and served on its own port during e2e runs.
// Passenger and driver start with the registration (G04); the admin app is for the team only.
export const MINI_APPS = [
  {
    name: 'passenger',
    port: 4101,
    welcome: t('common.welcome.verified'),
    action: t('common.myTrips'),
    // G76: the main button is the step of the block; the lists of the tests hold an offer.
    mainButton: t('home.dock.offersOpen'),
  },
  {
    name: 'driver',
    port: 4102,
    welcome: t('common.welcome.costsBack'),
    // G66: an approved driver publishes with the main button under «Qayerdan / Qayerga».
    action: t('home.publish'),
    mainButton: t('home.publish'),
  },
  // G75: the owner has «Boshqaruv» on the main screen of the team (mockup g67/1).
  { name: 'admin', port: 4103, welcome: null, action: t('common.admin.management'), mainButton: null },
] as const;

export const TEXT = {
  continue: t('common.continue'),
  about: t('account.about.title'),
  offerLink: t('account.consent.link.offer'),
  female: t('account.gender.female'),
  sendPhone: t('account.phone.send'),
  changePhoto: t('account.avatar.change'),
  profile: t('account.profile.open'),
  blocked: t('account.blocked.title'),
  from: t('places.from'),
  to: t('places.to'),
  // The passenger's search (G59): «Qayerdan» only when it is unknown, then «Qayerga borasiz?».
  toTitle: t('places.toTitle'),
  directions: t('find.title'),
  otherPlace: t('find.other'),
  change: t('find.change'),
  fromTitle: t('places.fromTitle'),
  search: t('places.search'),
  insideCity: t('errors.locations.inside_city'),
  // G62: the main screen of a new driver opens the application from this big tile.
  becomeDriver: t('home.dock.fill'),
  carTitle: t('drivers.car.title'),
  plateField: t('drivers.plate.title'),
  shutter: t('common.camera.shoot'),
  send: t('drivers.send'),
  resend: t('drivers.fix.send'),
  carChange: t('drivers.car.change'),
  pending: t('drivers.status.pending.title'),
  // The note on the main screen while the application is checked (G53).
  check: t('home.dock.afterCheckLong'),
  photoFront: t('drivers.tile.front'),
  photoSide: t('drivers.photo.side'),
  photoInside: t('drivers.photo.interior'),
  photos: t('drivers.photos.title'),
  approved: t('drivers.approved.title'),
  changes: t('home.dock.fixTitle'),
  requestChanges: t('moderation.requestChanges'),
  reasonFront: t('drivers.reason.front_unclear'),
  reasonPlate: t('drivers.reason.plate_not_readable'),
  reasonSide: t('drivers.reason.side_unclear'),
  approve: t('moderation.approve'),
  wholeRegion: t('places.wholeRegion'),
  newTrip: t('home.publish'),
  findTrip: t('common.passenger.findTrip'),
  tomorrow: /^Ertaga/,
  commentSkip: t('market.comment.skip'),
  publish: t('market.publish.send'),
  // «Mening safarim» of the trip just published (G63): its cancel link is there before the start.
  tripOpened: t('market.trip.cancel'),
  womanFilter: t('market.search.woman'),
  book: t('find.book', { count: '1' }),
  management: t('common.admin.management'),
  teamTrips: t('common.admin.trips'),
  requestsSee: t('home.dock.requestsSee'),
  pendingRequests: t('drivers.status.pending.requests'),
  pricing: t('pricing.title'),
  editFormula: t('pricing.edit'),
  preview: t('pricing.preview'),
  plateMatches: t('moderation.plateCheck.approve'),
  decided: t('moderation.decided'),
};
export const appUrl = (port: number) => `http://localhost:${port}/`;
// A case of «Navbat», as a button of the admin bot opens it (docs/50, G75): «application=<id>».
export const adminCase = (query: string) => `${appUrl(MINI_APPS[2].port)}?${query}`;

// The landing (G15) is plain HTML, served on its own port.
export const LANDING_PORT = 4104;

// «Safar eʼlon qilish» of an approved driver: the main button under «Qayerdan / Qayerga» (G66).
export const publishButton = (page: Page) => page.locator('#tg-main-button', { hasText: TEXT.newTrip });

// The buttons of the block at the bottom stand only while it is free and the driver approved (G76,
// docs/165): else a test opens the section the way a bot button does, ?open=<section> (docs/119).
export async function openSection(page: Page, section: string, label: string) {
  await page.waitForLoadState('networkidle');
  const button = page.locator('#tg-main-button, #tg-secondary-button', { hasText: label });
  if ((await button.isVisible()) && (await button.isEnabled())) return button.click();
  const [base = '', hash = ''] = page.url().split('#');
  await page.goto(`${base.split('?')[0]}?open=${section}#${hash}`);
}

export const openFindTrip = (page: Page) => openSection(page, 'find_trip', TEXT.findTrip);
