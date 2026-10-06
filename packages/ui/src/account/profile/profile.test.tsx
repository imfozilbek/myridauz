import { ApiError, type UsersClient } from '@platform/api-client';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StartFlow } from '../../flow/start-flow';
import { renderInShell } from '../../test-shell';
import { AccountContext, type Account } from '../account-context';

const compress = vi.hoisted(() => ({ compressImage: vi.fn(async (file: Blob) => file) }));
vi.mock('./compress-image', () => compress);

const profile = {
  id: '00000000000000000000000000000007',
  firstName: 'Dilnoza',
  gender: 'female' as const,
  phone: '+998901234567',
  roles: ['passenger' as const],
  hasAvatar: true,
  writeAccess: true,
  rating: null,
};

function renderProfile(overrides: Partial<Account> = {}, hasCamera = true) {
  const client = {
    getMe: vi.fn(),
    register: vi.fn(),
    uploadAvatar: vi.fn(async () => undefined),
    setWriteAccess: vi.fn(),
    deleteMe: vi.fn(async () => undefined),
    getAvatar: vi.fn(async () => new Blob(['x'], { type: 'image/jpeg' })),
  } satisfies UsersClient;
  const account: Account = {
    app: 'passenger',
    client,
    profile,
    settings: { passengerAvatarRequired: false },
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
  renderInShell(
    <AccountContext.Provider value={account}>
      <StartFlow actions={actions} />
    </AccountContext.Provider>,
    false,
    hasCamera,
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
    expect(client.getAvatar).toHaveBeenCalledWith('00000000000000000000000000000007');
    fireEvent.click(screen.getByText('Orqaga'));
    expect(screen.getByLabelText('Profil va rasm')).toBeTruthy();
  });

  it('uploads a new photo and reports a failure in simple words', async () => {
    const { client, account } = renderProfile();
    fireEvent.click(screen.getByText('Dilnoza'));
    expect(screen.getByText('Rasmni almashtirish')).toBeTruthy();
    // Why a passenger adds a photo (docs/86 T14).
    expect(screen.getByText('Rasm bilan haydovchi tezroq tasdiqlaydi.')).toBeTruthy();
    const input = document.querySelector('input[type=file]') as HTMLInputElement;
    expect(input.getAttribute('capture')).toBe('user');
    const photo = new File(['x'], 'me.jpg', { type: 'image/jpeg' });
    await act(async () => fireEvent.change(input, { target: { files: [photo] } }));
    expect(client.uploadAvatar).toHaveBeenCalledWith(photo);
    expect(account.onAvatarChanged).toHaveBeenCalled();
    client.uploadAvatar.mockRejectedValueOnce(new Error('offline'));
    await act(async () => fireEvent.change(input, { target: { files: [photo] } }));
    expect(screen.getByText('Rasmni yuklab boʻlmadi. Qayta urinib koʻring.')).toBeTruthy();
    // A photo too large says so: another try of the same photo would not help (docs/86 T5).
    client.uploadAvatar.mockRejectedValueOnce(new ApiError(413, 'users.avatar_too_large'));
    await act(async () => fireEvent.change(input, { target: { files: [photo] } }));
    expect(screen.getByText('Rasm juda katta. Boshqa rasmni tanlang.')).toBeTruthy();
  });

  it('sends people on Telegram Desktop to the phone: no camera there', () => {
    renderProfile({}, false);
    fireEvent.click(screen.getByText('Dilnoza'));
    expect(screen.getByText(/old kamerasida olinadi/)).toBeTruthy();
    expect(document.querySelector('input[type=file]')).toBeNull();
  });

  it('opens the front camera for a driver photo (docs/05)', () => {
    renderProfile({ app: 'driver', profile: { ...profile, hasAvatar: false } });
    fireEvent.click(screen.getByText('Dilnoza'));
    expect(screen.getByText('Rasm qoʻshish')).toBeTruthy();
    expect(document.querySelector('input[type=file]')?.getAttribute('capture')).toBe('user');
  });
});

describe('delete my data (docs/30)', () => {
  it('explains what is removed, removes it and starts again', async () => {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', { value: { ...window.location, reload }, configurable: true });
    const { client } = renderProfile();
    fireEvent.click(screen.getByText('Dilnoza'));
    // The dangerous row and button are red, like in Telegram (docs/86 V12).
    expect(screen.getByText('Maʼlumotlarimni oʻchirish').closest('.danger-text')).not.toBeNull();
    fireEvent.click(screen.getByText('Maʼlumotlarimni oʻchirish'));
    expect(screen.getByText(/Buni qaytarib boʻlmaydi/)).toBeTruthy();
    expect(screen.getByText('Oʻchirish').closest('.danger-button')).not.toBeNull();
    client.deleteMe.mockRejectedValueOnce(new Error('offline'));
    await act(async () => fireEvent.click(screen.getByText('Oʻchirish')));
    expect(screen.getByText(/qayta urinib/)).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByText('Oʻchirish')));
    expect(client.deleteMe).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Maʼlumotlaringiz oʻchirildi')).toBeTruthy();
    fireEvent.click(screen.getByText('Yopish'));
    expect(reload).toHaveBeenCalled();
  });

  it('opens a legal document from the profile', async () => {
    renderProfile();
    fireEvent.click(screen.getByText('Dilnoza'));
    expect(screen.getByText('Hujjatlar')).toBeTruthy();
    fireEvent.click(screen.getByText('Maxfiylik siyosati'));
    // The edition comes with the requisites from the API (G34).
    expect(await screen.findByText(/Tahrir 1\.2/)).toBeTruthy();
  });
});
