import { toCyrillic } from '@platform/i18n';
import { renderInShell, testClients } from '@platform/ui/testing';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StartPage } from './start-page';

afterEach(cleanup);

describe('StartPage', () => {
  it('opens the main screen with 3 actions', () => {
    const { tracked } = renderInShell(<StartPage />);
    for (const action of ['Soʻrov qoldirish', 'Mening safarlarim'].map((name) => toCyrillic(name)))
      expect(screen.getByText(action)).toBeTruthy();
    // «Safar topish» is the main button now, the list does not repeat it (G25).
    expect(screen.getAllByText(toCyrillic('Safar topish'))).toHaveLength(1);
    expect(tracked.filter((event) => event.name === 'screen_open').map((event) => event.screen)).toEqual([
      'home',
    ]);
  });

  it('opens a section and comes back', async () => {
    const clients = testClients({
      market: { myRequests: async () => [] },
      bookings: { myBookings: async () => [], myOffers: async () => [] },
    });
    renderInShell(<StartPage />, false, true, undefined, clients);
    fireEvent.click(screen.getByText(toCyrillic('Mening safarlarim')));
    expect(await screen.findByText(toCyrillic('Faol safar yoʻq'))).toBeTruthy();
    fireEvent.click(screen.getByText(toCyrillic('Orqaga')));
    // No bookings: the main screen asks where to go (G25).
    expect(await screen.findByText(toCyrillic('Qayerga borasiz?'))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: toCyrillic('Safar topish') }));
    // A new phone does not know «Qayerdan»: its list opens at once (G59): the main screen is gone.
    await waitFor(() => expect(screen.queryByText(toCyrillic('Mening safarlarim'))).toBeNull());
    expect(await screen.findByText(toCyrillic('Qayerdan yoʻlga chiqasiz?'))).toBeTruthy();
  });
});
