import type { Trip } from '@platform/contracts';

// A trip and the places of the channel tests (docs/15).
export const PLACES = new Map([
  ['1726', { name: 'Toshkent shahri', parentId: null }],
  ['1726269', { name: 'Chilonzor', parentId: '1726' }],
  ['1718', { name: 'Samarqand viloyati', parentId: null }],
  ['1718401', { name: 'Samarqand shahri', parentId: '1718' }],
  ['1706', { name: 'Buxoro viloyati', parentId: null }],
  ['1706401', { name: 'Buxoro shahri', parentId: '1706' }],
]);
export const CHANNELS = [
  { username: 'ch_samarqand', places: ['1718'] },
  { username: 'ch_buxoro', places: ['1706'] },
];
export const TRIP: Trip = {
  id: 'trip-1',
  driver: {
    id: 1,
    firstName: 'Jasur',
    hasAvatar: true,
    car: { make: 'Chevrolet', model: 'Cobalt', color: 'white' },
    rating: { average: null, count: 0 },
  },
  from: '1726269',
  to: '1718401',
  departAt: Date.parse('2026-10-02T03:30:00Z'),
  km: 300,
  seats: 4,
  seatsLeft: 3,
  price: 85000,
  recommendedPrice: null,
  woman: true,
  hasMeetingPoint: false,
  comment: '',
  status: 'active',
};
