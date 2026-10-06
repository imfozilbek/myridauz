import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountContext, type Account } from '../account/account-context';
import { ProfileScreen } from '../account/profile/profile-screen';
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
  it('F6: the car camera keeps «Назад», it closes the camera and the step stays', async () => {
    const onBack = vi.fn();
    inTelegram(
      <PhotosStep photos={photos} reasons={[]} onPhotos={vi.fn()} onBack={onBack} onDone={vi.fn()} />,
    );
    expect(native.mainShown).toBe(true);
    fireEvent.click(screen.getByText('Old tomondan, raqami bilan').closest('button') as HTMLElement);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(native.backShown).toBe(true);
    // The button hides once nobody takes it after the step gave it away (G41, docs/108 E).
    await waitFor(() => expect(native.mainShown).toBe(false));
    act(pressBack);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onBack).not.toHaveBeenCalled();
    expect(native.mainShown).toBe(true);
    act(pressBack);
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('F7: the face camera behaves the same: «Davom etish» hides, «Назад» closes the camera', async () => {
    const onBack = vi.fn();
    inTelegram(
      <PhotosStep photos={photos} reasons={[]} onPhotos={vi.fn()} onBack={onBack} onDone={vi.fn()} />,
    );
    expect(native.mainShown).toBe(true);
    // The face is the first photo of the same screen (G34).
    fireEvent.click(screen.getByText('Yuzingiz').closest('button') as HTMLElement);
    expect(screen.getByRole('dialog')).toBeTruthy();
    // The button hides once nobody takes it after the step gave it away (G41, docs/108 E).
    await waitFor(() => expect(native.mainShown).toBe(false));
    act(pressBack);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onBack).not.toHaveBeenCalled();
    expect(native.mainShown).toBe(true);
  });

  it('G58: in the profile the photo opens the camera or the gallery of the phone, no own camera', () => {
    const onBack = vi.fn();
    inTelegram(<ProfileScreen onBack={onBack} />);
    fireEvent.click(screen.getByText('Rasmni almashtirish'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onBack).not.toHaveBeenCalled();
  });
});
