import { loadBrand } from '@platform/brands';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../../test-shell';
import { AccountGate } from '../account-gate';
import { fakeClient, settings } from '../account-test-kit';
import { addFace, passWelcome } from './registration-test-kit';

// The welcome of the passenger Mini App, as apps/miniapp-passenger gives it (G34).
const welcome = {
  logo: 'logo.svg',
  points: [
    { icon: 'team', textKey: 'common.welcome.verified' },
    { icon: 'price', textKey: 'common.welcome.shareCosts' },
    { icon: 'hidden', textKey: 'account.about.hidden' },
  ],
} as const;
const HIDDEN = /hech kimga koʻr/;
const click = async (text: string) => fireEvent.click(await screen.findByText(text));
const open = () =>
  renderInShell(
    <AccountGate
      app="passenger"
      client={fakeClient({ state: 'unregistered', suggestedName: 'Dilnoza', settings })}
      welcome={welcome}
    >
      <p>inside</p>
    </AccountGate>,
  );
afterEach(cleanup);

vi.mock('../profile/compress-image', () => ({ compressImage: async (file: Blob) => file }));

describe('RegistrationFlow: two screens (G58)', () => {
  it('«Orqaga» from «Siz haqingizda» keeps the ticks, the photo, the name and the gender', async () => {
    const { container } = open();
    await passWelcome();
    await addFace(container);
    fireEvent.change(screen.getByDisplayValue('Dilnoza'), { target: { value: 'Dilya' } });
    await click('Ayol');
    await click('Orqaga');
    expect(await screen.findByText(loadBrand().slogan)).toBeTruthy();
    expect(screen.getAllByRole('checkbox').every((box) => (box as HTMLInputElement).checked)).toBe(true);
    await click('Davom etish');
    expect(screen.getByDisplayValue('Dilya')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Rasmni almashtirish' })).toBeTruthy();
    expect(screen.getByText('Raqamni yuborish')).toBeTruthy();
  });

  it('says on both screens of the passenger that the number is hidden (the approved mockups)', async () => {
    open();
    await screen.findByText(loadBrand().slogan);
    expect(screen.getAllByText(HIDDEN)).toHaveLength(1);
    await passWelcome();
    expect(screen.getAllByText(HIDDEN)).toHaveLength(1);
  });
});
