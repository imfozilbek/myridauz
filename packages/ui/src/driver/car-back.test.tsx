import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileScreen } from '../account/profile/profile-screen';
import { pressBack } from '../test-native';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { DriverGate } from './driver-gate';
import { application, car } from './driver-test-kit';

vi.mock('@telegram-apps/sdk-react', async (original) => ({
  ...(await original<object>()),
  ...(await import('../test-native')).nativeButtons,
}));
afterEach(cleanup);

const approved = application({
  status: 'approved',
  car,
  photos: { front: true, side: true, interior: true },
});

// The app of a driver with «Profil» opened from the main screen.
function App() {
  const [profile, setProfile] = useState(false);
  if (profile) return <ProfileScreen onBack={() => setProfile(false)} />;
  return (
    <button type="button" onClick={() => setProfile(true)}>
      main screen
    </button>
  );
}

// «Profil» → «Mashinam» → «Назад» (G77, docs/168 B): the app stays under the form of the car, so
// Telegram «Назад» comes back to «Profil», not to the main screen.
describe('the car opened from «Profil»', () => {
  it('«Назад» comes back to «Profil»', async () => {
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
    expect(await screen.findByText('Mashinangiz')).toBeTruthy();
    act(pressBack);
    expect(screen.queryByText('Mashinangiz')).toBeNull();
    expect(screen.getByText('Mashinam')).toBeTruthy();
    expect(screen.queryByText('main screen')).toBeNull();
  });
});
