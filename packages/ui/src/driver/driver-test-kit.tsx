import type { UsersClient } from '@platform/api-client';
import { REASON_PLACE, type DriverApplication } from '@platform/contracts';
import { fireEvent, screen } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { vi } from 'vitest';
import { AccountContext, type Account } from '../account/account-context';
import { renderInShell, testClients } from '../test-shell';
import { DriverGate } from './driver-gate';
import { DriverNotice } from './driver-notice';

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
    deleteMe: unused,
    getAvatar: unused,
  } as UsersClient,
  profile: {
    id: '00000000000000000000000000000001',
    firstName: 'Ali',
    gender: 'male',
    phone: '+998901234567',
    roles: ['passenger'],
    hasAvatar: true,
    writeAccess: true,
    rating: null,
    avatarStatus: null,
    avatarReason: null,
  },
  avatarVersion: 0,
  onAvatarChanged: () => undefined,
  onProfileChanged: () => undefined,
};

// The person of the tests; a new selfie changes the face at once, like the account gate does.
function TestAccount({ face, children }: { readonly face: boolean; readonly children: ReactNode }) {
  const [hasAvatar, setHasAvatar] = useState(face);
  const [avatarVersion, setVersion] = useState(0);
  const value: Account = {
    ...account,
    client: {
      ...account.client,
      uploadAvatar: async () => undefined,
      getAvatar: () => Promise.reject(new Error('test.none')),
    },
    profile: { ...account.profile, hasAvatar },
    avatarVersion,
    onAvatarChanged: () => {
      setHasAvatar(true);
      setVersion((version) => version + 1);
    },
  };
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function renderGate(initial: DriverApplication | null, face = true) {
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
    <TestAccount face={face}>
      <DriverGate>
        <DriverNotice />
        <p data-testid="driver-home" />
      </DriverGate>
    </TestAccount>,
    false,
    true,
    undefined,
    clients,
  );
  return { ...result, submit, uploadPhoto };
}

export const tap = async (text: string) => fireEvent.click(await screen.findByText(text));
// Taps the first photo button with this text and "takes" a photo with the camera of that side:
// the front camera for the face, the main one for the car.
export function shoot(
  container: HTMLElement,
  button: string,
  facing: 'user' | 'environment' = 'environment',
) {
  const input = container.querySelector(`input[type=file][capture=${facing}]`);
  if (!input) throw new Error('test.no_input');
  const face = (element: HTMLElement) =>
    element.closest('button')?.textContent?.includes('Yuzingiz') === true;
  const [first] = screen.getAllByText(button).filter((element) => face(element) === (facing === 'user'));
  fireEvent.click(first as HTMLElement);
  fireEvent.change(input, { target: { files: [new File(['x'], 'car.jpg', { type: 'image/jpeg' })] } });
}
