import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';

const { t } = createI18n(DEFAULT_LOCALE);

// Each Mini App is built and served on its own port during e2e runs.
// Passenger and driver start with the registration (G04); the admin app is for the team only.
export const MINI_APPS = [
  {
    name: 'passenger',
    port: 4101,
    welcome: t('common.passenger.welcome'),
    action: t('common.passenger.findTrip'),
  },
  { name: 'driver', port: 4102, welcome: t('common.driver.welcome'), action: t('common.driver.newTrip') },
  { name: 'admin', port: 4103, welcome: null, action: t('common.admin.applications') },
] as const;

export const TEXT = {
  continue: t('common.continue'),
  accept: t('account.consent.accept'),
  female: t('account.gender.female'),
  sendPhone: t('account.phone.send'),
  profile: t('account.profile.open'),
  blocked: t('account.blocked.title'),
  from: t('places.from'),
  to: t('places.to'),
  search: t('places.search'),
  wholeCity: t('places.wholeCity'),
  insideCity: t('errors.locations.inside_city'),
  becomeDriver: t('drivers.intro.title'),
  start: t('drivers.intro.start'),
  plateField: t('drivers.plate.title'),
  take: t('drivers.photo.take'),
  shutter: t('common.camera.shoot'),
  addPhoto: t('account.avatar.add'),
  seatsTitle: t('drivers.seats.title'),
  retake: t('drivers.photo.retake'),
  send: t('drivers.review.send'),
  pending: t('drivers.status.pending.title'),
  photoFront: t('drivers.photo.front'),
  plate: t('drivers.review.plate'),
  photos: t('drivers.photos.title'),
  avatar: t('drivers.avatar.title'),
  requestChanges: t('moderation.requestChanges'),
  reasonFront: t('drivers.reason.front_unclear'),
  reasonPlate: t('drivers.reason.plate_not_readable'),
  approve: t('moderation.approve'),
  wholeRegion: t('places.wholeRegion'),
  newTrip: t('common.driver.newTrip'),
  findTrip: t('common.passenger.findTrip'),
  tomorrow: /^Ertaga/,
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
