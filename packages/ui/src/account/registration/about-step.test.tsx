import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../../test-shell';
import { AccountGate } from '../account-gate';
import { fakeClient, settings } from '../account-test-kit';

const permissions = vi.hoisted(() => ({
  requestSignedContact: vi.fn(async (): Promise<string | null> => 'contact=signed'),
  requestBotMessages: vi.fn(async () => true),
}));
vi.mock('../../telegram/permissions', () => permissions);

const welcome = { textKey: 'common.passenger.welcome', points: [] } as const;
const SEND = 'Raqamni yuborish';
async function openAbout() {
  renderInShell(
    <AccountGate
      app="passenger"
      client={fakeClient({ state: 'unregistered', suggestedName: 'Dilnoza', settings })}
      welcome={welcome}
    >
      <p>inside</p>
    </AccountGate>,
  );
  fireEvent.click(await screen.findByText('Davom etish'));
  await screen.findByText('Siz haqingizda');
}
const ticked = (text: string) =>
  screen.getByText(text).closest('[role="button"]')?.querySelector('.lucide-check');
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('Registration, screen 2: «Siz haqingizda» (G34)', () => {
  it('asks the name from Telegram and the gender on one screen', async () => {
    await openAbout();
    expect(screen.getByDisplayValue('Dilnoza')).toBeTruthy();
    expect(screen.getByText(/Ismingizni safar sheriklaringiz koʻradi/)).toBeTruthy();
    expect(screen.getByText('Raqamingiz hech kimga koʻrinmaydi.')).toBeTruthy();
    // The phone is asked only when both answers are there.
    expect(screen.queryByText(SEND)).toBeNull();
  });

  it('one tap chooses the gender and stays on the screen; the tick moves', async () => {
    await openAbout();
    fireEvent.click(screen.getByText('Erkak'));
    expect(ticked('Erkak')).toBeTruthy();
    fireEvent.click(screen.getByText('Ayol'));
    expect(ticked('Ayol')).toBeTruthy();
    expect(ticked('Erkak')).toBeFalsy();
    expect(screen.getByText('Siz haqingizda')).toBeTruthy();
    expect(screen.getByText(SEND)).toBeTruthy();
    expect(permissions.requestSignedContact).not.toHaveBeenCalled();
  });

  it('a name that is not a name says why and hides the button until it is fixed', async () => {
    await openAbout();
    fireEvent.click(screen.getByText('Ayol'));
    fireEvent.change(screen.getByDisplayValue('Dilnoza'), { target: { value: 'Ali 998' } });
    expect(screen.getByText(/Faqat harflardan/)).toBeTruthy();
    expect(screen.queryByText(SEND)).toBeNull();
    fireEvent.change(screen.getByDisplayValue('Ali 998'), { target: { value: 'Ali' } });
    expect(screen.queryByText(/Faqat harflardan/)).toBeNull();
    expect(screen.getByText(SEND)).toBeTruthy();
  });

  it('«Orqaga» returns to the welcome', async () => {
    await openAbout();
    fireEvent.click(screen.getByText('Orqaga'));
    expect(await screen.findByText(/tugmasini bosib, siz/)).toBeTruthy();
  });
});
