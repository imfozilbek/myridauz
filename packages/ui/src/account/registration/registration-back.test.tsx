import { loadBrand } from '@platform/brands';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderInShell } from '../../test-shell';
import { AccountGate } from '../account-gate';
import { fakeClient, settings } from '../account-test-kit';

// The welcome of the passenger Mini App, as apps/miniapp-passenger gives it (G34).
const welcome = {
  textKey: 'common.passenger.welcome',
  points: [
    { icon: 'team', textKey: 'common.welcome.verified' },
    { icon: 'price', textKey: 'common.welcome.shareCosts' },
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

describe('RegistrationFlow: two screens (G34)', () => {
  it('«Orqaga» from «Siz haqingizda» keeps the name and the gender', async () => {
    open();
    await click('Davom etish');
    fireEvent.change(screen.getByDisplayValue('Dilnoza'), { target: { value: 'Dilya' } });
    await click('Ayol');
    await click('Orqaga');
    expect(await screen.findByText(loadBrand().slogan)).toBeTruthy();
    await click('Davom etish');
    expect(screen.getByDisplayValue('Dilya')).toBeTruthy();
    expect(screen.getByText('Raqamni yuborish')).toBeTruthy();
  });

  it('says once in the whole path that the number is hidden', async () => {
    open();
    await screen.findByText(loadBrand().slogan);
    expect(screen.queryAllByText(HIDDEN)).toHaveLength(0);
    await click('Davom etish');
    expect(screen.getAllByText(HIDDEN)).toHaveLength(1);
  });
});
