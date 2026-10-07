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
    action: t('common.passenger.findTrip'),
    // G25: the main screen keeps the main action on the Telegram button.
    mainButton: t('common.passenger.findTrip'),
  },
  {
    name: 'driver',
    port: 4102,
    welcome: t('common.welcome.costsBack'),
    // G62: an approved driver publishes from the big tile on top, no main button.
    action: t('home.publish'),
    mainButton: null,
  },
  { name: 'admin', port: 4103, welcome: null, action: t('common.admin.applications'), mainButton: null },
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
  becomeDriver: t('drivers.become.title'),
  carTitle: t('drivers.car.title'),
  plateField: t('drivers.plate.title'),
  shutter: t('common.camera.shoot'),
  send: t('drivers.send'),
  resend: t('drivers.fix.send'),
  carChange: t('drivers.car.change'),
  pending: t('drivers.status.pending.title'),
  // The note on the main screen while the application is checked (G53).
  check: t('home.check.title'),
  photoFront: t('drivers.tile.front'),
  photoSide: t('drivers.photo.side'),
  photoInside: t('drivers.photo.interior'),
  photos: t('drivers.photos.title'),
  approved: t('drivers.approved.title'),
  changes: t('drivers.status.changes_requested.title'),
  requestChanges: t('moderation.requestChanges'),
  reasonFront: t('drivers.reason.front_unclear'),
  reasonPlate: t('drivers.reason.plate_not_readable'),
  reasonSide: t('drivers.reason.side_unclear'),
  approve: t('moderation.approve'),
  wholeRegion: t('places.wholeRegion'),
  newTrip: t('home.publish'),
  findTrip: t('common.passenger.findTrip'),
  tomorrow: /^Ertaga/,
  otherDay: t('market.date.otherDay'),
  tripSeatsTitle: t('market.seats.title'),
  priceTitle: t('market.price.title'),
  commentSkip: t('market.comment.skip'),
  publish: t('market.review.publish'),
  published: t('market.published.title'),
  womanFilter: t('market.search.woman'),
  book: t('find.book', { count: '1' }),
  management: t('common.admin.management'),
  teamTrips: t('common.admin.trips'),
  passengerRequests: t('common.driver.passengerRequests'),
  pendingRequests: t('drivers.status.pending.requests'),
  pricing: t('pricing.title'),
  editFormula: t('pricing.edit'),
  preview: t('pricing.preview'),
  plateMatches: t('moderation.plateCheck.approve'),
  decided: t('moderation.decided'),
};
export const appUrl = (port: number) => `http://localhost:${port}/`;

// The landing (G15) is plain HTML, served on its own port.
export const LANDING_PORT = 4104;

// «Safar eʼlon qilish» of an approved driver: the big tile on top of the main screen (G62).
export const newTripTile = (page: Page) => page.locator('.main-tile', { hasText: TEXT.newTrip });
