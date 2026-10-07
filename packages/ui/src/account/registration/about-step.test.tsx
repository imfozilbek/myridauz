import { loadBrand } from '@platform/brands';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../../test-shell';
import { AccountGate } from '../account-gate';
import { fakeClient } from '../account-test-kit';
import { addFace, passWelcome } from './registration-test-kit';

const permissions = vi.hoisted(() => ({
  requestSignedContact: vi.fn(async (): Promise<string | null> => 'contact=signed'),
  requestBotMessages: vi.fn(async () => true),
}));
vi.mock('../../telegram/permissions', () => permissions);
vi.mock('../profile/compress-image', () => ({ compressImage: async (file: Blob) => file }));

const welcome = { logo: 'logo.svg', points: [] } as const;
const SEND = 'Raqamni yuborish';
const sendReady = () => !screen.getByRole('button', { name: SEND }).hasAttribute('disabled');
async function openAbout() {
  const view = renderInShell(
    <AccountGate
      app="passenger"
      client={fakeClient({ state: 'unregistered', suggestedName: 'Dilnoza' })}
      welcome={welcome}
    >
      <p>inside</p>
    </AccountGate>,
  );
  await passWelcome();
  return view.container;
}
const chosen = (text: string) => screen.getByRole('radio', { name: text }).getAttribute('aria-checked');
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('Registration, screen 2: «Siz haqingizda» (G58)', () => {
  it('shows step 2 of 2, the face circle, the name under «Ism» and two gender tiles', async () => {
    const container = await openAbout();
    expect(container.querySelectorAll('.about-steps i')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Rasm qoʻshish' })).toBeTruthy();
    expect(screen.getByText('Ism')).toBeTruthy();
    expect(screen.getByDisplayValue('Dilnoza')).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(screen.getByText('Raqamingiz hech kimga koʻrinmaydi.')).toBeTruthy();
    expect(sendReady()).toBe(false);
  });

  it('a picked photo shows in the circle and the words become «Rasmni almashtirish»', async () => {
    const container = await openAbout();
    await addFace(container);
    expect(container.querySelector('.face-circle-photo')?.getAttribute('src')).toBe('blob:face');
    expect(screen.getByRole('button', { name: 'Rasmni almashtirish' })).toBeTruthy();
    // The phone offers the camera or the gallery: the input does not force the camera.
    expect(container.querySelector('.face-circle input')?.hasAttribute('capture')).toBe(false);
  });

  it('«Raqamni yuborish» works only with the photo, the name and the gender', async () => {
    const container = await openAbout();
    fireEvent.click(screen.getByText('Ayol'));
    expect(chosen('Ayol')).toBe('true');
    expect(sendReady()).toBe(false);
    await addFace(container);
    expect(sendReady()).toBe(true);
    fireEvent.click(screen.getByText('Erkak'));
    expect(chosen('Erkak')).toBe('true');
    expect(chosen('Ayol')).toBe('false');
    expect(permissions.requestSignedContact).not.toHaveBeenCalled();
  });

  it('a name that is not a name says why and hides the button until it is fixed', async () => {
    const container = await openAbout();
    await addFace(container);
    fireEvent.click(screen.getByText('Ayol'));
    fireEvent.change(screen.getByDisplayValue('Dilnoza'), { target: { value: 'Ali 998' } });
    expect(screen.getByText(/Faqat harflardan/)).toBeTruthy();
    expect(sendReady()).toBe(false);
    fireEvent.change(screen.getByDisplayValue('Ali 998'), { target: { value: 'Ali' } });
    expect(screen.queryByText(/Faqat harflardan/)).toBeNull();
    expect(sendReady()).toBe(true);
  });

  it('«Orqaga» returns to the welcome', async () => {
    await openAbout();
    fireEvent.click(screen.getByText('Orqaga'));
    expect(await screen.findByText(`Nima uchun ${loadBrand().name}`)).toBeTruthy();
  });
});
