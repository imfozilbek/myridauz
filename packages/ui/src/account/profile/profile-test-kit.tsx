import type { UsersClient } from '@platform/api-client';
import type { Location, Standing } from '@platform/contracts';
import { vi } from 'vitest';
import { DriverContext, type Driver } from '../../driver/driver-context';
import { StartFlow } from '../../flow/start-flow';
import { renderInShell } from '../../test-shell';
import { testClients } from '../../test-clients';
import type { Overrides } from '../../test-clients-other';
import { AccountContext, type Account } from '../account-context';

// «Profil» of the mockup g65/3 in tests (G65): Dilnoza two months with the brand, her numbers, the
// channels she is in, a small directory with the regions of those channels.
export const NOW = Date.parse('2026-10-09T10:00:00+05:00');
export const profile = {
  id: '00000000000000000000000000000007',
  firstName: 'Dilnoza',
  gender: 'female' as const,
  phone: '+998901234567',
  roles: ['passenger' as const],
  hasAvatar: true,
  writeAccess: true,
  joinedAt: Date.parse('2026-08-09T00:00:00Z'),
  rating: 4.9,
  avatarStatus: null,
  avatarReason: null,
};
export const standing: Standing = { rating: { average: 4.9, count: 8 }, onTime: 100, trips: 12 };

const place = (id: string, parentId: string | null, name: string): Location => ({
  id,
  parentId,
  type: parentId === null ? 'region' : 'district',
  name,
  lat: 40,
  lng: 68,
  oneCity: false,
});
const PLACES = [
  place('1726', null, 'Toshkent shahri'),
  place('1703', null, 'Andijon viloyati'),
  place('1718', null, 'Samarqand viloyati'),
  place('1730', null, 'Fargʻona viloyati'),
  place('1726269', '1726', 'Chilonzor'),
  place('1703202', '1703', 'Andijon tumani'),
  place('1718203', '1718', 'Bulungʻur tumani'),
  place('1718401', '1718', 'Samarqand shahri'),
  place('1730203', '1730', 'Oltiariq tumani'),
  place('1730212', '1730', 'Qoʻqon shahri'),
];
const locations = { getLocations: async () => ({ version: '1', locations: PLACES }) };

export const approved: Driver = {
  application: {
    status: 'approved',
    car: { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 },
    photos: { front: true, side: true, interior: true },
    reasons: [],
  },
  editCar: vi.fn(),
};

type Options = { readonly driver?: Driver; readonly clients?: Overrides; readonly hasCamera?: boolean };

// The main screen with the profile card on top; a tap on the name opens «Profil».
export function renderProfile(overrides: Partial<Account> = {}, options: Options = {}) {
  const client = {
    getMe: vi.fn(),
    register: vi.fn(),
    uploadAvatar: vi.fn(async () => undefined),
    setWriteAccess: vi.fn(),
    deleteMe: vi.fn(async () => undefined),
    getAvatar: vi.fn(async () => new Blob(['x'], { type: 'image/jpeg' })),
  } satisfies UsersClient;
  const account: Account = {
    app: options.driver ? 'driver' : 'passenger',
    client,
    profile,
    avatarVersion: 0,
    onAvatarChanged: vi.fn(),
    onProfileChanged: vi.fn(),
    ...overrides,
  };
  const actions = [
    {
      id: 'my_trips',
      icon: 'myTrips',
      tone: 'deep',
      labelKey: 'common.myTrips',
      hintKey: 'common.passenger.myTripsHint',
      Screen: () => null,
    },
  ] as const;
  const { clients = {} } = options;
  const flow = <StartFlow actions={actions} />;
  const shell = renderInShell(
    <AccountContext.Provider value={account}>
      {options.driver ? <DriverContext.Provider value={options.driver}>{flow}</DriverContext.Provider> : flow}
    </AccountContext.Provider>,
    false,
    options.hasCamera ?? true,
    locations,
    testClients({
      ...clients,
      comfort: { standing: async () => standing, ...clients.comfort },
      channels: { mine: async () => [], ...clients.channels },
    }),
  );
  return { client, account, ...shell };
}
