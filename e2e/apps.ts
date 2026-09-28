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
  plateHint: t('drivers.plate.hint'),
  send: t('drivers.review.send'),
  pending: t('drivers.status.pending.title'),
  photoFront: t('drivers.photo.front'),
  photoSide: t('drivers.photo.side'),
  photoInterior: t('drivers.photo.interior'),
  approve: t('moderation.approve'),
  decided: t('moderation.decided'),
};
export const appUrl = (port: number) => `http://localhost:${port}/`;
