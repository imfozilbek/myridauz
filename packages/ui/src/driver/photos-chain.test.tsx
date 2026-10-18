import type { DriversClient } from '@platform/api-client';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountContext, type Account } from '../account/account-context';
import { renderInShell, testClients } from '../test-shell';
import { application, car } from './driver-test-kit';
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

// One photo of the car since 18.10.2026 (owner decision): no camera opens after it (before: G40).
describe('the car photo', () => {
  it('opens the camera once, sends the photo and opens no camera after it', async () => {
    const uploadPhoto = vi.fn<DriversClient['uploadPhoto']>(async (kind) =>
      application({ photos: { front: kind === 'front' } }),
    );
    const { container } = renderInShell(
      <AccountContext.Provider value={account}>
        <PhotosStep
          car={car}
          photos={{ front: false }}
          reasons={[]}
          fixing={false}
          failure={null}
          onPhotos={vi.fn()}
          onChange={vi.fn()}
          onBack={vi.fn()}
          onSend={vi.fn()}
        />
      </AccountContext.Provider>,
      false,
      true,
      undefined,
      testClients({ drivers: { uploadPhoto } }),
    );
    const input = container.querySelector('input[type=file][capture=environment]') as HTMLInputElement;
    const opened = vi.spyOn(input, 'click');
    fireEvent.click(screen.getByText('Old tomondan', { exact: true }).closest('button') as HTMLElement);
    expect(opened).toHaveBeenCalledOnce();
    fireEvent.change(input, { target: { files: [new File(['x'], 'car.jpg', { type: 'image/jpeg' })] } });
    await waitFor(() => expect(uploadPhoto).toHaveBeenCalledWith('front', expect.anything()));
    expect(uploadPhoto).toHaveBeenCalledOnce();
    expect(opened).toHaveBeenCalledOnce();
  });
});
