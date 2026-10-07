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
    rating: null,
    avatarStatus: null,
    avatarReason: null,
  },
};

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('mountApp', () => {
  it('lets a registered person in and signs API calls for its Mini App', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    const fetch = vi.spyOn(window, 'fetch').mockImplementation(async () => Response.json(active));
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
