import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileScreen } from '../account/profile/profile-screen';
import { DriverGate } from '../driver/driver-gate';
import { application, car } from '../driver/driver-test-kit';
import { HomeGoProvider } from '../flow/home-context';
import { renderMarket } from '../market/market-test-kit';
import { pressBack } from '../test-native';
import { renderInShell, testClients } from '../test-shell';
import { HelpLink } from './help-link';

vi.mock('@telegram-apps/sdk-react', async (original) => ({
  ...(await original<object>()),
  ...(await import('../test-native')).nativeButtons,
}));
afterEach(cleanup);

// T6 of G97 (docs/226): a screen a person may get stuck on opens «Yordam» on its topic.
describe('«… boʻyicha savollar»', () => {
  it('opens the section «Yordam» on the topic of the screen', () => {
    const go = vi.fn();
    const { tracked } = renderInShell(
      <HomeGoProvider value={go}>
        <HelpLink topic="wallet" />
      </HomeGoProvider>,
    );
    fireEvent.click(screen.getByText('Hamyon va komissiya boʻyicha savollar'));
    expect(go).toHaveBeenCalledWith('help', { help: 'wallet' });
    expect(tracked.at(-1)).toMatchObject({ name: 'help_open', code: 'wallet' });
  });

  it('is not drawn where nothing can open «Yordam»', () => {
    renderInShell(<HelpLink topic="wallet" />);
    expect(screen.queryByText('Hamyon va komissiya boʻyicha savollar')).toBeNull();
  });

  it('the car of the application opens the answers of a driver, «Назад» comes back to the car', async () => {
    function App() {
      const [profile, setProfile] = useState(false);
      if (profile) return <ProfileScreen onBack={() => setProfile(false)} />;
      return (
        <button type="button" onClick={() => setProfile(true)}>
          main screen
        </button>
      );
    }
    const approved = application({ status: 'approved', car, photos: { front: true } });
    renderMarket(
      <DriverGate>
        <App />
      </DriverGate>,
      testClients({ drivers: { getApplication: async () => approved } }),
      'male',
      true,
    );
    fireEvent.click(await screen.findByText('main screen'));
    fireEvent.click(await screen.findByText('Mashinam'));
    fireEvent.click(await screen.findByText('Haydovchi boʻlish boʻyicha savollar'));
    expect(screen.getByText('Arizam qaytarildi. Nima qilaman?')).toBeTruthy();
    act(pressBack);
    expect(await screen.findByText('Mashinangiz')).toBeTruthy();
  });
});
