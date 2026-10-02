import { loadBrand } from '@platform/brands';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderInShell } from '../../test-shell';
import { AccountGate } from '../account-gate';
import { fakeClient, settings } from '../account-test-kit';

const welcome = {
  icon: 'search',
  textKey: 'common.passenger.welcome',
  points: [{ icon: 'hidden', textKey: 'common.welcome.hidden' }],
} as const;
const click = async (text: string) => fireEvent.click(await screen.findByText(text));
afterEach(cleanup);

describe('RegistrationFlow: «Назад» (docs/94 B7)', () => {
  it('the consent goes back to the welcome; the gender shows the answer chosen before', async () => {
    const client = fakeClient({ state: 'unregistered', suggestedName: 'Dilnoza', settings });
    renderInShell(
      <AccountGate app="passenger" client={client} welcome={welcome}>
        <p>inside</p>
      </AccountGate>,
    );
    await click('Davom etish');
    await click('Orqaga');
    expect(await screen.findByText(loadBrand().slogan)).toBeTruthy();
    await click('Davom etish');
    await click('Roziman');
    await click('Davom etish');
    await click('Ayol');
    expect(await screen.findByText('Raqamni yuborish')).toBeTruthy();
    await click('Orqaga');
    // «Ayol» has its tick: «Davom etish» keeps it.
    await click('Davom etish');
    expect(await screen.findByText('Raqamni yuborish')).toBeTruthy();
  });
});
