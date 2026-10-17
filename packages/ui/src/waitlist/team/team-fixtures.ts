import type { AdLink, WaitlistOverview } from '@platform/contracts';

// The waiting people and two links of the ads for the tests of the team (docs/181, docs/184).
export const OVERVIEW: WaitlistOverview = {
  passengers: 1240,
  drivers: 86,
  directions: [
    { region: '1718', passengers: 124, drivers: 9, opened: null },
    {
      region: '1703',
      passengers: 87,
      drivers: 1,
      opened: { at: Date.parse('2026-11-02T05:00:00Z'), sent: 133 },
    },
  ],
  topPain: { pain: 'chats', share: 64 },
};
export const AD: AdLink = {
  code: 'ad-k7f2qx',
  link: 'https://t.me/main_bot?start=ad-k7f2qx',
  target: 'bot',
  channel: null,
  place: 'telegram',
  name: 'Toshkent eʼlonlari',
  price: 300_000,
  days: 3,
  top: 1,
  pin: 24,
  at: Date.parse('2026-10-12T05:00:00Z'),
  result: {
    registered: 0,
    clicked: 214,
    opened: 150,
    passengers: 88,
    drivers: 8,
    joined: 44,
    stayed: 0,
    byFriends: 31,
  },
};
// Owner, 17.10.2026: a link into the passenger bot counts who registered by it.
export const TRIPS_AD: AdLink = {
  ...AD,
  code: 'ad-p4x9q2',
  link: 'https://t.me/passenger_bot?startapp=__ad-p4x9q2',
  target: 'passenger',
  name: 'Bloger Aziz',
  result: { ...AD.result, registered: 3 },
};
