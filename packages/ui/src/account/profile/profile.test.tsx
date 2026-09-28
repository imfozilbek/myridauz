import type { UsersClient } from '@platform/api-client';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StartFlow } from '../../flow/start-flow';
import { renderInShell } from '../../test-shell';
import { AccountContext, type Account } from '../account-context';

const compress = vi.hoisted(() => ({ compressImage: vi.fn(async (file: Blob) => file) }));
vi.mock('./compress-image', () => compress);

const profile = {
  id: 7,
  firstName: 'Dilnoza',
  gender: 'female' as const,
  phone: '+998901234567',
  roles: ['passenger' as const],
  hasAvatar: true,
  writeAccess: true,
  rating: null,
};

function renderProfile(overrides: Partial<Account> = {}) {
  const client = {
    getMe: vi.fn(),
    register: vi.fn(),
    uploadAvatar: vi.fn(async () => undefined),
    setWriteAccess: vi.fn(),
    getAvatar: vi.fn(async () => new Blob(['x'], { type: 'image/jpeg' })),
  } satisfies UsersClient;
  const account: Account = {
    app: 'passenger',
    client,
    profile,
    settings: { passengerAvatarRequired: false },
    avatarVersion: 0,
    onAvatarChanged: vi.fn(),
    ...overrides,
  };
  const actions = [
    { id: 'my_trips', icon: 'myTrips', tone: 'deep', labelKey: 'common.myTrips', hintKey: 'common.soon' },
  ] as const;
  renderInShell(
    <AccountContext.Provider value={account}>
      <StartFlow actions={actions} />
    </AccountContext.Provider>,
  );
  return { client, account };
}

beforeEach(() => {
  vi.clearAllMocks();
  URL.createObjectURL = vi.fn(() => 'blob:photo');
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

describe('profile', () => {
  it('starts from the own account on the main screen and shows the profile', async () => {
    const { client } = renderProfile();
    fireEvent.click(screen.getByText('Dilnoza'));
    expect(screen.getByText('Yangi')).toBeTruthy();
    expect(screen.getByText('+998 90 123 45 67')).toBeTruthy();
    expect(screen.getByText('Raqamingizni faqat siz koʻrasiz.')).toBeTruthy();
    await waitFor(() => expect(screen.getAllByAltText('Dilnoza').length).toBeGreaterThan(0));
    expect(client.getAvatar).toHaveBeenCalledWith(7);
    fireEvent.click(screen.getByText('Orqaga'));
    expect(screen.getByText('Profil va rasm')).toBeTruthy();
  });

  it('uploads a new photo and reports a failure in simple words', async () => {
    const { client, account } = renderProfile();
    fireEvent.click(screen.getByText('Dilnoza'));
    expect(screen.getByText('Rasmni almashtirish')).toBeTruthy();
    const input = document.querySelector('input[type=file]') as HTMLInputElement;
    expect(input.getAttribute('capture')).toBeNull();
    const photo = new File(['x'], 'me.jpg', { type: 'image/jpeg' });
    await act(async () => fireEvent.change(input, { target: { files: [photo] } }));
    expect(client.uploadAvatar).toHaveBeenCalledWith(photo);
    expect(account.onAvatarChanged).toHaveBeenCalled();
    client.uploadAvatar.mockRejectedValueOnce(new Error('offline'));
    await act(async () => fireEvent.change(input, { target: { files: [photo] } }));
    expect(screen.getByText('Rasmni yuklab boʻlmadi. Qayta urinib koʻring.')).toBeTruthy();
  });

  it('opens the front camera for a driver photo (docs/05)', () => {
    renderProfile({ app: 'driver', profile: { ...profile, hasAvatar: false } });
    fireEvent.click(screen.getByText('Dilnoza'));
    expect(screen.getByText('Rasm qoʻshish')).toBeTruthy();
    expect(document.querySelector('input[type=file]')?.getAttribute('capture')).toBe('user');
  });
});
