import type { Stats, StatsPeriod } from '@platform/contracts';

// A dashboard answer for tests and screenshots (docs/29).
export const statsOf = (period: StatsPeriod, events: Stats['events'] = 'on'): Stats => ({
  period,
  numbers: {
    newUsers: period === 'day' ? 24 : 158,
    trips: period === 'day' ? 9 : 61,
    activeTrips: 12,
    bookings: period === 'day' ? 17 : 103,
    driverApplications: period === 'day' ? 3 : 12,
    complaints: period === 'day' ? 1 : 4,
  },
  arrivals: {
    sources: [
      { kind: 'channel', mark: 'yol-samarqand', count: period === 'day' ? 11 : 64 },
      { kind: 'direct', mark: '', count: period === 'day' ? 7 : 49 },
      { kind: 'ad', mark: 'insta1', count: period === 'day' ? 4 : 31 },
      { kind: 'story', mark: '', count: period === 'day' ? 2 : 14 },
    ],
    platforms: [
      { platform: 'android', count: period === 'day' ? 19 : 121 },
      { platform: 'ios', count: period === 'day' ? 4 : 30 },
      { platform: 'desktop', count: period === 'day' ? 1 : 7 },
    ],
  },
  events,
  funnels:
    events === 'on'
      ? [
          {
            id: 'passenger',
            steps: [
              { step: 'opened', count: 320, drop: null },
              { step: 'searched', count: 210, drop: 34 },
              { step: 'trip_opened', count: 150, drop: 29 },
              { step: 'requested', count: 60, drop: 60 },
              { step: 'chat', count: 44, drop: 27 },
              { step: 'confirmed', count: 38, drop: 14 },
              { step: 'boarded', count: 31, drop: 18 },
            ],
          },
        ]
      : [],
  errors:
    events === 'on'
      ? [
          {
            kind: 'crash',
            app: 'passenger',
            screen: 'home',
            code: 'render',
            what: 'TypeError: x is undefined',
            count: 2,
          },
          {
            kind: 'refusal',
            app: 'driver',
            screen: 'market.review',
            code: 'trips.too_many',
            what: '',
            count: 7,
          },
        ]
      : [],
  at: Date.parse('2026-10-05T09:30:00Z'),
});
