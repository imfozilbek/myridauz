import type { UsersClient } from '@platform/api-client';
import { REASON_PLACE, type DriverApplication } from '@platform/contracts';
import { fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { AccountContext, type Account } from '../account/account-context';
import { renderInShell, testClients } from '../test-shell';
import { DriverGate } from './driver-gate';
import { PendingNotice } from './pending-notice';

// Test helper for the driver application: a registered person and a fake server.
export const car = {
  make: 'Chevrolet',
  model: 'Cobalt',
  color: 'white',
  plate: '01A123BC',
  seats: 4,
} as const;
export const application = (patch: Partial<DriverApplication>): DriverApplication => ({
  status: 'draft',
  car: null,
  photos: { front: false, side: false, interior: false },
  reasons: [],
  ...patch,
});
const unused = async (): Promise<never> => {
  throw new Error('test.unused');
};
const account: Account = {
  app: 'driver',
  client: {
    getMe: unused,
    register: unused,
    uploadAvatar: unused,
    setWriteAccess: unused,
    getAvatar: unused,
  } as UsersClient,
  profile: {
    id: 1,
    firstName: 'Ali',
    gender: 'male',
    phone: '+998901234567',
    roles: ['passenger'],
    hasAvatar: true,
    writeAccess: true,
    rating: null,
  },
  settings: { passengerAvatarRequired: false },
  avatarVersion: 0,
  onAvatarChanged: () => undefined,
};

export function renderGate(initial: DriverApplication | null) {
  let photos = initial?.photos ?? { front: false, side: false, interior: false };
  const submit = vi.fn(async () => application({ status: 'pending', car }));
  let reasons = initial?.reasons ?? [];
  const uploadPhoto = vi.fn(async (kind: 'front' | 'side' | 'interior') => {
    photos = { ...photos, [kind]: true };
    // The server drops the reasons of a retaken photo.
    reasons = reasons.filter((reason) => REASON_PLACE[reason] !== kind);
    return application({ photos, reasons });
  });
  const clients = testClients({ drivers: { getApplication: async () => initial, uploadPhoto, submit } });
  const result = renderInShell(
    <AccountContext.Provider value={account}>
      <DriverGate>
        <PendingNotice />
        <p data-testid="driver-home" />
      </DriverGate>
    </AccountContext.Provider>,
    false,
    true,
    undefined,
    clients,
  );
  return { ...result, submit, uploadPhoto };
}

export const tap = async (text: string) => fireEvent.click(await screen.findByText(text));
// Taps the first photo button with this text and "takes" a photo.
export function shoot(container: HTMLElement, button: string) {
  const input = container.querySelector('input[type=file]');
  if (!input) throw new Error('test.no_input');
  fireEvent.click(screen.getAllByText(button)[0] as HTMLElement);
  fireEvent.change(input, { target: { files: [new File(['x'], 'car.jpg', { type: 'image/jpeg' })] } });
}
