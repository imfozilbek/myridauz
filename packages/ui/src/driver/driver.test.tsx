import type { UsersClient } from '@platform/api-client';
import type { DriverApplication } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountContext, type Account } from '../account/account-context';
import { renderInShell, testClients } from '../test-shell';
import { DriverGate } from './driver-gate';

vi.mock('../account/profile/compress-image', () => ({ compressImage: async (file: Blob) => file }));
afterEach(cleanup);

const car = {
  make: 'Chevrolet',
  model: 'Cobalt',
  color: 'white',
  year: 2020,
  plate: '01A123BC',
  seats: 4,
} as const;
const application = (patch: Partial<DriverApplication>): DriverApplication => ({
  status: 'draft',
  car: null,
  photos: { front: false, side: false, interior: false },
  reason: null,
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

function renderGate(initial: DriverApplication | null) {
  let photos = { front: false, side: false, interior: false };
  const submit = vi.fn(async () => application({ status: 'pending', car }));
  const uploadPhoto = vi.fn(async (kind: 'front' | 'side' | 'interior') => {
    photos = { ...photos, [kind]: true };
    return application({ photos });
  });
  const clients = testClients({ drivers: { getApplication: async () => initial, uploadPhoto, submit } });
  const result = renderInShell(
    <AccountContext.Provider value={account}>
      <DriverGate>
        <p>driver home</p>
      </DriverGate>
    </AccountContext.Provider>,
    false,
    true,
    undefined,
    clients,
  );
  return { ...result, submit, uploadPhoto };
}

const tap = async (text: string) => fireEvent.click(await screen.findByText(text));

describe('DriverGate: the application of a driver (docs/04)', () => {
  it('asks one question per screen and sends the application', async () => {
    const { submit, tracked, container } = renderGate(null);
    for (const step of ['Boshlash', 'Chevrolet', 'Cobalt', 'Oq', '2020']) await tap(step);
    fireEvent.change(screen.getByPlaceholderText('Masalan: 01 A 123 BC'), {
      target: { value: '01 a 123 bc' },
    });
    await tap('Davom etish');
    await tap('4');
    await tap('Davom etish');
    const input = container.querySelector('input[type=file]');
    if (!input) throw new Error('test.no_input');
    for (const kind of ['Old tomondan, raqami bilan', 'Yon tomondan', 'Salon']) {
      await tap(kind);
      fireEvent.change(input, { target: { files: [new File(['x'], 'car.jpg', { type: 'image/jpeg' })] } });
      await screen.findAllByText('Tayyor');
    }
    await tap('Davom etish');
    expect(await screen.findByText('01 A 123 BC')).toBeTruthy();
    await tap('Yuborish');
    expect(await screen.findByText('Ariza tekshirilmoqda')).toBeTruthy();
    expect(submit).toHaveBeenCalledWith(car);
    const steps = tracked.filter((event) => event.name === 'driver_application_step');
    expect(steps.map((event) => ('step' in event ? event.step : ''))).toEqual([
      'car',
      'color',
      'year',
      'plate',
      'seats',
      'avatar',
      'photos',
      'submitted',
    ]);
  });

  it('shows the reason of a refusal and opens the application to fix it', async () => {
    renderGate(
      application({
        status: 'changes_requested',
        car,
        reason: 'plate_not_readable',
        photos: { front: true, side: true, interior: true },
      }),
    );
    expect(await screen.findByText('Sabab: Davlat raqami oʻqilmaydi')).toBeTruthy();
    await tap('Tuzatish');
    await tap('Davlat raqami');
    expect(screen.getByDisplayValue('01A123BC')).toBeTruthy();
  });

  it('lets an approved driver in', async () => {
    renderGate(application({ status: 'approved', car, photos: { front: true, side: true, interior: true } }));
    expect(await screen.findByText('driver home')).toBeTruthy();
  });
});
