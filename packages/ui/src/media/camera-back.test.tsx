import type { ModerationReason } from '@platform/contracts';
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
  profile: {
    id: '00000000000000000000000000000001',
    firstName: 'Ali',
    hasAvatar: true,
    rating: null,
    roles: ['passenger', 'driver'],
  },
  avatarVersion: 0,
  onAvatarChanged: () => undefined,
  onProfileChanged: () => undefined,
} as unknown as Account;
const photos = { front: true, side: true, interior: true };
const car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 } as const;

type PhotosProps = { readonly reasons: readonly ModerationReason[]; readonly onBack: () => void };
const Photos = ({ reasons, onBack }: PhotosProps) => (
  <PhotosStep
    car={car}
    photos={photos}
    reasons={reasons}
    fixing={reasons.length > 0}
    failure={null}
    onPhotos={vi.fn()}
    onChange={vi.fn()}
    onBack={onBack}
    onSend={vi.fn()}
  />
);

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
    inTelegram(<Photos reasons={[]} onBack={onBack} />);
    expect(native.mainShown).toBe(true);
    fireEvent.click(screen.getByText('Old tomondan', { exact: true }).closest('button') as HTMLElement);
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
    inTelegram(<Photos reasons={['face_not_visible']} onBack={onBack} />);
    expect(native.mainShown).toBe(true);
    // The face comes back to the fix only when the team asks for a new one (G62).
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
