import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountContext, type Account } from '../account/account-context';
import { ProfileScreen } from '../account/profile/profile-screen';
import { AvatarStep } from '../driver/steps/avatar-step';
import { PhotosStep } from '../driver/steps/photos-step';
import { native, pressBack } from '../test-native';
import { renderInShell } from '../test-shell';

vi.mock('@telegram-apps/sdk-react', async (original) => ({
  ...(await original<object>()),
  ...(await import('../test-native')).nativeButtons,
}));

const account = {
  app: 'driver',
  client: { getAvatar: () => Promise.reject(new Error('test.none')) },
  profile: { id: '00000000000000000000000000000001', firstName: 'Ali', hasAvatar: true, rating: null },
  settings: { passengerAvatarRequired: false },
  avatarVersion: 0,
  onAvatarChanged: () => undefined,
  onProfileChanged: () => undefined,
} as unknown as Account;
const photos = { front: true, side: true, interior: true };

beforeEach(() => {
  const stream = { getTracks: () => [] };
  vi.stubGlobal('navigator', { ...navigator, mediaDevices: { getUserMedia: async () => stream } });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const inTelegram = (shown: ReactNode) =>
  renderInShell(<AccountContext.Provider value={account}>{shown}</AccountContext.Provider>, true);

describe('the cameras and «Назад» of Telegram (docs/94 F6, F7)', () => {
  it('F6: the car camera keeps «Назад», it closes the camera and the step stays', () => {
    const onBack = vi.fn();
    inTelegram(
      <PhotosStep photos={photos} reasons={[]} onPhotos={vi.fn()} onBack={onBack} onDone={vi.fn()} />,
    );
    expect(native.mainShown).toBe(true);
    fireEvent.click(screen.getByText('Old tomondan, raqami bilan').closest('button') as HTMLElement);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(native.backShown).toBe(true);
    expect(native.mainShown).toBe(false);
    act(pressBack);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onBack).not.toHaveBeenCalled();
    expect(native.mainShown).toBe(true);
    act(pressBack);
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('F7: the face camera behaves the same: «Davom etish» hides, «Назад» closes the camera', () => {
    const onBack = vi.fn();
    inTelegram(<AvatarStep reasons={[]} onBack={onBack} onDone={vi.fn()} />);
    expect(native.mainShown).toBe(true);
    fireEvent.click(screen.getByText('Rasmni almashtirish'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(native.mainShown).toBe(false);
    act(pressBack);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onBack).not.toHaveBeenCalled();
    expect(native.mainShown).toBe(true);
  });

  it('F7: in the profile «Назад» closes the camera, not the profile', () => {
    const onBack = vi.fn();
    inTelegram(<ProfileScreen onBack={onBack} />);
    fireEvent.click(screen.getByText('Rasmni almashtirish'));
    act(pressBack);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onBack).not.toHaveBeenCalled();
  });
});
