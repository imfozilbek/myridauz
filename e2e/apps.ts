import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';

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
    // G25: an approved driver publishes from the main button, the list does not repeat it.
    action: t('home.publish'),
    mainButton: t('home.publish'),
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
  // The lists of the passenger's search (G35): «Qayerga» first, «Qayerdan» only when it is unknown.
  toTitle: t('places.toTitle'),
  fromTitle: t('places.fromTitle'),
  search: t('places.search'),
  insideCity: t('errors.locations.inside_city'),
  // G34: the main screen of a new driver opens the application from this card.
  becomeDriver: t('drivers.application.title'),
  plateField: t('drivers.plate.title'),
  take: t('drivers.photo.take'),
  shutter: t('common.camera.shoot'),
  retake: t('drivers.photo.retake'),
  send: t('drivers.review.send'),
  pending: t('drivers.status.pending.title'),
  // The note on the main screen while the application is checked (G53).
  check: t('home.check.title'),
  photoFront: t('drivers.photo.front'),
  plate: t('drivers.review.plate'),
  photos: t('drivers.photos.title'),
  face: t('drivers.photo.face'),
  sent: t('drivers.sent.title'),
  requestChanges: t('moderation.requestChanges'),
  reasonFront: t('drivers.reason.front_unclear'),
  reasonPlate: t('drivers.reason.plate_not_readable'),
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
  book: t('market.trip.book'),
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
