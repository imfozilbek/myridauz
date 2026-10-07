import type { DriversClient } from '@platform/api-client';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountContext, type Account } from '../account/account-context';
import { renderInShell, testClients } from '../test-shell';
import { application } from './driver-test-kit';
import { PhotosStep } from './steps/photos-step';

vi.mock('../account/profile/compress-image', () => ({ compressImage: async (file: Blob) => file }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const account = {
  app: 'driver',
  client: { getAvatar: () => Promise.reject(new Error('test.none')) },
  profile: { id: '00000000000000000000000000000001', firstName: 'Ali', hasAvatar: true, rating: null },
  avatarVersion: 0,
  onAvatarChanged: () => undefined,
  onProfileChanged: () => undefined,
} as unknown as Account;

describe('the car photos one after another (G40, docs/106 K7)', () => {
  it('opens the camera again for the next empty photo after an upload', async () => {
    const uploadPhoto = vi.fn<DriversClient['uploadPhoto']>(async (kind) =>
      application({ photos: { front: kind === 'front', side: false, interior: false } }),
    );
    const { container } = renderInShell(
      <AccountContext.Provider value={account}>
        <PhotosStep
          photos={{ front: false, side: false, interior: false }}
          reasons={[]}
          onPhotos={vi.fn()}
          onBack={vi.fn()}
          onDone={vi.fn()}
        />
      </AccountContext.Provider>,
      false,
      true,
      undefined,
      testClients({ drivers: { uploadPhoto } }),
    );
    const input = container.querySelector('input[type=file][capture=environment]') as HTMLInputElement;
    const opened = vi.spyOn(input, 'click');
    fireEvent.click(screen.getByText('Old tomondan, raqami bilan').closest('button') as HTMLElement);
    expect(opened).toHaveBeenCalledOnce();
    fireEvent.change(input, { target: { files: [new File(['x'], 'car.jpg', { type: 'image/jpeg' })] } });
    await waitFor(() => expect(uploadPhoto).toHaveBeenCalledWith('front', expect.anything()));
    // No tap on the next slot: the camera of the side photo is open.
    await waitFor(() => expect(opened).toHaveBeenCalledTimes(2));
    fireEvent.change(input, { target: { files: [new File(['y'], 'side.jpg', { type: 'image/jpeg' })] } });
    await waitFor(() => expect(uploadPhoto).toHaveBeenCalledWith('side', expect.anything()));
  });
});
