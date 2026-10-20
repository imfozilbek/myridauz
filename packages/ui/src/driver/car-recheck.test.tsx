import type { DriversClient } from '@platform/api-client';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountContext, type Account } from '../account/account-context';
import { tap } from '../market/market-test-kit';
import { renderInShell, testClients } from '../test-shell';
import { ApplicationFlow } from './application-flow';
import { application, car } from './driver-test-kit';

vi.mock('../account/profile/compress-image', () => ({ compressImage: async (file: Blob) => file }));
afterEach(() => {
  cleanup();
  localStorage.clear();
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
const WARN =
  'Yangi rasm mashinani qayta tekshiruvga yuboradi. Tekshiruv tugaguncha yangi safar eʼlon qila olmaysiz.';
const LEAVE = 'Arizani yuboring, aks holda tekshiruv boshlanmaydi.';

function openApproved() {
  const uploadPhoto = vi.fn<DriversClient['uploadPhoto']>(async () =>
    application({ status: 'draft', car, photos: { front: true } }),
  );
  const onClose = vi.fn();
  const { container } = renderInShell(
    <AccountContext.Provider value={account}>
      <ApplicationFlow
        initial={application({ status: 'approved', car, photos: { front: true } })}
        onSubmitted={vi.fn()}
        onClose={onClose}
      />
    </AccountContext.Provider>,
    false,
    true,
    undefined,
    testClients({ drivers: { uploadPhoto } }),
  );
  return { container, uploadPhoto, onClose };
}

// Decision 3 of the owner (20.10.2026, G91 DRV-3): a new photo of an approved car sends it to the
// check again. It is said before the first photo; after it, leaving without «Yuborish» asks.
describe('a new photo of an approved car', { timeout: 20_000 }, () => {
  it('is warned about before the camera, and leaving after it asks', async () => {
    const asked = vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
    const { container, uploadPhoto, onClose } = openApproved();
    await tap('Davom etish');
    const input = container.querySelector('input[type=file][capture=environment]') as HTMLInputElement;
    const opened = vi.spyOn(input, 'click');
    const tile = () => screen.getByText('Old tomondan', { exact: true }).closest('button') as HTMLElement;
    fireEvent.click(tile());
    await waitFor(() => expect(asked).toHaveBeenCalledWith(WARN));
    expect(opened).not.toHaveBeenCalled();
    asked.mockReturnValueOnce(true);
    fireEvent.click(tile());
    await waitFor(() => expect(opened).toHaveBeenCalledOnce());
    fireEvent.change(input, { target: { files: [new File(['x'], 'car.jpg', { type: 'image/jpeg' })] } });
    await waitFor(() => expect(uploadPhoto).toHaveBeenCalledOnce());
    asked.mockReturnValueOnce(false);
    await tap('Orqaga');
    await tap('Orqaga');
    await waitFor(() => expect(asked).toHaveBeenLastCalledWith(LEAVE));
    expect(onClose).not.toHaveBeenCalled();
  });
});
