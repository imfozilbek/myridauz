import { toCyrillic } from '@platform/i18n';
import { ApiError } from '@platform/api-client';
import { loadBrand } from '@platform/brands';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../../test-shell';
import { AccountGate } from '../account-gate';
import { active, fakeClient } from '../account-test-kit';
import { addFace, passWelcome } from './registration-test-kit';

const permissions = vi.hoisted(() => ({
  requestSignedContact: vi.fn(async (): Promise<string | null> => 'contact=signed'),
  requestBotMessages: vi.fn(async () => true),
}));
vi.mock('../../telegram/permissions', () => permissions);
vi.mock('../profile/compress-image', () => ({ compressImage: async (file: Blob) => file }));

const welcome = { logo: 'logo.svg', points: [] } as const;
const SEND = toCyrillic('Raqamni yuborish');
const sendReady = () => !screen.getByRole('button', { name: SEND }).hasAttribute('disabled');
async function openAbout(app: 'passenger' | 'driver' = 'passenger') {
  const client = fakeClient({ state: 'unregistered', suggestedName: 'Dilnoza' });
  const view = renderInShell(
    <AccountGate app={app} client={client} welcome={welcome}>
      <p>inside</p>
    </AccountGate>,
  );
  await passWelcome();
  return Object.assign(view.container, { client });
}
const chosen = (text: string) => screen.getByRole('radio', { name: text }).getAttribute('aria-checked');
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('Registration, screen 2: «Siz haqingizda» (G58)', () => {
  it('shows step 2 of 2, the face circle, the name under «Ism» and two gender tiles', async () => {
    const container = await openAbout();
    expect(container.querySelectorAll('.about-steps i')).toHaveLength(2);
    // A passenger may go without a photo (owner decision 19.10.2026, G51).
    expect(screen.getByRole('button', { name: toCyrillic('Rasm (ixtiyoriy)') })).toBeTruthy();
    expect(screen.getByText(toCyrillic('Ism'))).toBeTruthy();
    expect(screen.getByDisplayValue('Dilnoza')).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(screen.getByText(toCyrillic('Raqamingiz hech kimga koʻrinmaydi.'))).toBeTruthy();
    expect(sendReady()).toBe(false);
  });

  it('a picked photo shows in the circle and the words become «Rasmni almashtirish»', async () => {
    const container = await openAbout();
    await addFace(container);
    expect(container.querySelector('.face-circle-photo')?.getAttribute('src')).toBe('blob:face');
    expect(screen.getByRole('button', { name: toCyrillic('Rasmni almashtirish') })).toBeTruthy();
    // Only the front camera, never the gallery (owner, 17.10.2026).
    expect(container.querySelector('.face-circle input')?.getAttribute('capture')).toBe('user');
  });

  it('a driver: «Raqamni yuborish» works only with the photo, the name and the gender', async () => {
    const container = await openAbout('driver');
    expect(screen.getByRole('button', { name: toCyrillic('Rasm qoʻshish') })).toBeTruthy();
    fireEvent.click(screen.getByText(toCyrillic('Ayol')));
    expect(chosen(toCyrillic('Ayol'))).toBe('true');
    expect(sendReady()).toBe(false);
    await addFace(container);
    expect(sendReady()).toBe(true);
    fireEvent.click(screen.getByText(toCyrillic('Erkak')));
    expect(chosen(toCyrillic('Erkak'))).toBe('true');
    expect(chosen(toCyrillic('Ayol'))).toBe('false');
    expect(permissions.requestSignedContact).not.toHaveBeenCalled();
  });

  it('a name that is not a name says why and hides the button until it is fixed', async () => {
    const container = await openAbout();
    await addFace(container);
    fireEvent.click(screen.getByText(toCyrillic('Ayol')));
    fireEvent.change(screen.getByDisplayValue('Dilnoza'), { target: { value: 'Ali 998' } });
    expect(screen.getByText(/Фақат ҳарфлардан/)).toBeTruthy();
    expect(sendReady()).toBe(false);
    fireEvent.change(screen.getByDisplayValue('Ali 998'), { target: { value: 'Ali' } });
    expect(screen.queryByText(/Фақат ҳарфлардан/)).toBeNull();
    expect(sendReady()).toBe(true);
  });

  it('a passenger: registered with the name and the gender, no photo is sent (G51)', async () => {
    const { client } = await openAbout();
    fireEvent.click(screen.getByText(toCyrillic('Ayol')));
    expect(sendReady()).toBe(true);
    fireEvent.click(screen.getByText(SEND));
    expect(await screen.findByText('inside')).toBeTruthy();
    expect(client.register).toHaveBeenCalled();
    expect(client.uploadAvatar).not.toHaveBeenCalled();
  });

  // G89 U4: a lost network is not a refused number; a lost answer of a saved registration lets in.
  it('says the network failed, and lets in after an answer lost on the way', async () => {
    const { client } = await openAbout();
    fireEvent.click(screen.getByText(toCyrillic('Ayol')));
    client.register.mockRejectedValueOnce(new ApiError(0, 'network.timeout'));
    fireEvent.click(screen.getByText(SEND));
    expect(await screen.findByText(/^Интернет билан алоқа йўқ/u)).toBeTruthy();
    expect(screen.queryByText(/^Рақамсиз/u)).toBeNull();
    client.register.mockRejectedValueOnce(new ApiError(409, 'users.already_registered'));
    client.getMe.mockResolvedValueOnce(active);
    fireEvent.click(screen.getByText(SEND));
    expect(await screen.findByText('inside')).toBeTruthy();
  });

  // G89 U13: a photo of a passenger lost on the way is sent once more, not dropped without a word.
  it('sends the photo once more when the first upload fails', async () => {
    const container = await openAbout();
    await addFace(container);
    fireEvent.click(screen.getByText(toCyrillic('Ayol')));
    container.client.uploadAvatar.mockRejectedValueOnce(new ApiError(0, 'network.timeout'));
    fireEvent.click(screen.getByText(SEND));
    expect(await screen.findByText('inside')).toBeTruthy();
    expect(container.client.uploadAvatar).toHaveBeenCalledTimes(2);
  });

  it('«Orqaga» returns to the welcome', async () => {
    await openAbout();
    fireEvent.click(screen.getByText(toCyrillic('Orqaga')));
    expect(await screen.findByText(`${toCyrillic('Nima uchun')} ${loadBrand().name}`)).toBeTruthy();
  });
});
