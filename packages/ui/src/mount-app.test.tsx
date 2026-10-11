import { act, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountApp } from './mount-app';

const Page = () => <p>sahifa</p>;
const active = {
  state: 'active',
  profile: {
    id: '00000000000000000000000000000001',
    firstName: 'Ali',
    gender: 'male',
    phone: '+998',
    roles: ['passenger', 'driver'],
    hasAvatar: true,
    writeAccess: true,
    joinedAt: Date.parse('2026-08-09T00:00:00Z'),
    rating: null,
    avatarStatus: null,
    avatarReason: null,
  },
};

const car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 };
const photos = { front: true, side: true, interior: true };
const application = (status: string) => ({ application: { status, car, photos, reasons: [] } });
// The API of the tests: who the person is, the application of the driver, else the same person.
const api = (status = 'approved') =>
  vi
    .spyOn(window, 'fetch')
    .mockImplementation(async (url) =>
      Response.json(String(url).endsWith('/driver/application') ? application(status) : active),
    );

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('mountApp', () => {
  it('lets a registered person in and signs API calls for its Mini App', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    const fetch = api();
    await act(async () =>
      mountApp('driver', Page, {
        welcome: { logo: 'logo-driver.svg', points: [] },
      }),
    );
    await waitFor(() => expect(document.body.textContent).toContain('sahifa'));
    expect(document.title).toBeTruthy();
    const me = fetch.mock.calls.find(([url]) => String(url).endsWith('/api/me'));
    expect(me?.[1]?.headers).toMatchObject({ 'x-mini-app': 'driver' });
    // The sound set in use is read without a signature (docs/115).
    expect(fetch.mock.calls.some(([url]) => String(url).endsWith('/api/public/sounds'))).toBe(true);
  });

  // The gate of the driver stands above the links of the bots (G77, finding 12): a screen a bot opens
  // knows the application; a rejected one says why, never a screen of the trips.
  it('a bot link of a driver opens behind the gate of the driver', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    window.history.replaceState(null, '', '/?mytrip=0000000a-0000-4000-8000-000000000001');
    api('rejected');
    await act(async () => mountApp('driver', Page, { welcome: { logo: 'logo-driver.svg', points: [] } }));
    await waitFor(() => expect(document.body.textContent).toContain('Ariza rad etildi'));
    window.history.replaceState(null, '', '/');
  });

  it('opens the admin Mini App after the team check', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    vi.spyOn(window, 'fetch').mockImplementation(async () => Response.json(active));
    await act(async () => mountApp('admin', Page));
    await waitFor(() => expect(document.body.textContent).toContain('sahifa'));
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  it('fails without a root element', () => {
    expect(() => mountApp('driver', Page)).toThrow('ui.root_missing');
  });
});
