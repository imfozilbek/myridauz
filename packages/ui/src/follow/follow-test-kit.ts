import type { SharedTrip } from '@platform/contracts';

export const TOKEN = 'a'.repeat(43);
const DEPART = Date.parse('2026-10-02T03:00:00Z');
export const TRIP: SharedTrip = {
  ...{ passengerName: 'Dilnoza', from: '1726269', to: '1730401' },
  ...{ departAt: DEPART, firstDepartAt: DEPART },
  km: 320,
  driver: {
    ...{ id: 'd1', firstName: 'Jasur', hasAvatar: true, rating: { average: 4.9, count: 12 } },
    car: { make: 'Chevrolet', model: 'Cobalt', color: 'white' },
  },
  plate: '01A123BC',
  meetingPoint: { lat: 41.3, lng: 69.2 },
  dropoffPoint: { lat: 39.65, lng: 66.97 },
  status: 'boarded',
  followers: 1,
  via: 'follow-a1b2c3',
};
