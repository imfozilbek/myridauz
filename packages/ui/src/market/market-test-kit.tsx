import type { UsersClient } from '@platform/api-client';
import type { Location, Trip } from '@platform/contracts';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { expect } from 'vitest';
import type { ReactNode } from 'react';
import { AccountContext, type Account } from '../account/account-context';
import type { ApiClients } from '../context/api-clients';
import { renderInShell } from '../test-shell';

// Test helper for trips and requests: a small directory, a trip, a person and the shell.
const TASHKENT = { lat: 41, lng: 69 };
const FARGONA = { lat: 40.38, lng: 71.78 };
const place = (
  id: string,
  parentId: string | null,
  name: string,
  { lat, lng } = TASHKENT,
  oneCity = false,
): Location => ({ id, parentId, type: parentId === null ? 'region' : 'district', name, lat, lng, oneCity });
const LOCATIONS = [
  place('1726', null, 'Toshkent shahri', TASHKENT, true),
  place('1730', null, 'Fargʻona viloyati', FARGONA),
  place('1726269', '1726', 'Chilonzor'),
  place('1730401', '1730', 'Fargʻona shahri', FARGONA),
];
export const locations = { getLocations: async () => ({ version: '1', locations: LOCATIONS }) };
// Chilonzor → Fargʻona shahri, as a known route of a flow.
export const ROUTE = {
  from: place('1726269', '1726', 'Chilonzor'),
  to: place('1730401', '1730', 'Fargʻona shahri', FARGONA),
};

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
    car: { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC' },
    rating: { average: 4.8, count: 37 },
  },
  from: '1726269',
  to: '1730401',
  departAt: Date.parse('2026-10-02T03:00:00Z'),
  km: 320,
  seats: 3,
  seatsLeft: 3,
  price: 95000,
  firstDepartAt: Date.parse('2026-10-02T03:00:00Z'),
  firstPrice: 95000,
  recommendedPrice: 95000,
  woman: true,
  pickupMode: 'both',
  bookingRule: 'seats',
  pitak: { id: 'qoyliq', name: 'Qoʻyliq pitagi', point: { lat: 41.2438, lng: 69.3394 }, hint: null },
  comment: 'Katta yuk olmayman',
  status: 'active',
  departedAt: null,
  arrivedAt: null,
  private: false,
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
    joinedAt: Date.parse('2026-08-09T00:00:00Z'),
    rating: null,
    avatarStatus: null,
    avatarReason: null,
  },
  avatarVersion: 0,
  onAvatarChanged: () => undefined,
  onProfileChanged: () => undefined,
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
// A trip of «Mening safarlarim» opens from its row (G64, mockup g64/6), an over one from «Oʻtgan».
export async function openOwnTrip() {
  await waitFor(() => expect(document.querySelector('.driver-trip, .market-tabs')).not.toBeNull());
  const live = document.querySelector('.driver-trip');
  if (!live) {
    fireEvent.click(screen.getByText('Oʻtgan'));
    await waitFor(() => expect(document.querySelector('.trip-card')).not.toBeNull());
  }
  fireEvent.click((live ?? document.querySelector('.trip-card')) as HTMLElement);
}

// From Chilonzor (Toshkent shahri) to Fargʻona shahri, or to the whole Fargʻona region: «Qayerga»
// opens by itself, both ends chosen go on without «Davom etish» (G40, docs/106 K1).
export async function chooseRoute(wholeRegion = false) {
  for (const step of ['Qayerdan', 'Toshkent shahri', 'Chilonzor', 'Fargʻona viloyati']) await tap(step);
  await tap(wholeRegion ? 'Butun viloyat' : 'Fargʻona shahri');
}

// The search and a request (G35, docs/97 K1): «Qayerga» opens at once, then «Qayerdan»; both
// chosen, the next screen opens without «Davom etish».
export async function quickRoute(wholeRegion = false) {
  await tap('Fargʻona viloyati');
  await tap(wholeRegion ? 'Butun viloyat' : 'Fargʻona shahri');
  await tap('Toshkent shahri');
  await tap('Chilonzor');
}

// The name under the pin is known: «Shu yerda» takes the point (the list «Oxirgi joylar» may
// show the same name, so the pin itself is checked).
export async function takePoint(name: string) {
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe(name), { timeout: 3000 });
  await tap(/^Shu yerda/u);
}
