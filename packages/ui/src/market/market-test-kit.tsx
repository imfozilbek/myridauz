import type { UsersClient } from '@platform/api-client';
import type { Location, Trip } from '@platform/contracts';
import { fireEvent, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AccountContext, type Account } from '../account/account-context';
import type { ApiClients } from '../context/api-clients';
import { renderInShell } from '../test-shell';

// Test helper for trips and requests: a small directory, a trip, a person and the shell.
const place = (id: string, parentId: string | null, name: string, oneCity = false): Location => ({
  id,
  parentId,
  type: parentId === null ? 'region' : 'district',
  name,
  lat: 41,
  lng: 69,
  oneCity,
});
const LOCATIONS = [
  place('1726', null, 'Toshkent shahri', true),
  place('1730', null, 'Fargʻona viloyati'),
  place('1726269', '1726', 'Chilonzor'),
  place('1730401', '1730', 'Fargʻona shahri'),
];
export const locations = { getLocations: async () => ({ version: '1', locations: LOCATIONS }) };

export const recommendation = {
  from: '1726269',
  to: '1730401',
  km: 320,
  price: 95000,
  source: 'formula',
  minPrice: 30000,
  maxPrice: 600000,
  roundStep: 5000,
} as const;

export const trip: Trip = {
  id: 't1',
  driver: {
    id: '00000000000000000000000000000007',
    firstName: 'Jasur',
    hasAvatar: false,
    car: { make: 'Chevrolet', model: 'Cobalt', color: 'white' },
    rating: { average: 4.8, count: 37 },
  },
  from: '1726269',
  to: '1730401',
  departAt: Date.parse('2026-10-02T03:00:00Z'),
  km: 320,
  seats: 3,
  seatsLeft: 3,
  price: 95000,
  recommendedPrice: 95000,
  woman: true,
  pickupMode: 'both',
  pitak: { id: 'qoyliq', name: 'Qoʻyliq pitagi', point: { lat: 41.2438, lng: 69.3394 } },
  comment: 'Katta yuk olmayman',
  status: 'active',
};

const unused = async (): Promise<never> => {
  throw new Error('test.unused');
};
const account = (gender: 'male' | 'female'): Account => ({
  app: 'driver',
  client: {
    getMe: unused,
    register: unused,
    uploadAvatar: unused,
    setWriteAccess: unused,
    deleteMe: unused,
    getAvatar: unused,
  } as UsersClient,
  profile: {
    id: '00000000000000000000000000000001',
    firstName: 'Ali',
    gender,
    phone: '+998901234567',
    roles: ['passenger', 'driver'],
    hasAvatar: false,
    writeAccess: true,
    rating: null,
  },
  settings: { passengerAvatarRequired: false },
  avatarVersion: 0,
  onAvatarChanged: () => undefined,
});

export function renderMarket(ui: ReactNode, clients: ApiClients, gender: 'male' | 'female' = 'male') {
  return renderInShell(
    <AccountContext.Provider value={account(gender)}>{ui}</AccountContext.Provider>,
    false,
    true,
    locations,
    clients,
  );
}

export const tap = async (text: string | RegExp) => fireEvent.click(await screen.findByText(text));

// From Chilonzor (Toshkent shahri) to Fargʻona shahri, or to the whole Fargʻona region.
export async function chooseRoute(wholeRegion = false) {
  for (const step of ['Qayerdan', 'Toshkent shahri', 'Chilonzor', 'Qayerga', 'Fargʻona viloyati'])
    await tap(step);
  await tap(wholeRegion ? 'Butun viloyat' : 'Fargʻona shahri');
  await tap('Davom etish');
}

// The same route through the list of districts under «Qayerdan / Qayerga» (G24): the other way
// when the map does not load. The district centers become the points.
export async function chooseWay(done = 'Safarlarni koʻrish') {
  await tap('Roʻyxatdan tanlash');
  await chooseRoute();
  await tap(done);
}
