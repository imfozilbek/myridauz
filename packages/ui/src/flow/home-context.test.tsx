import { cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { booking } from '../bookings/booking-test-kit';
import { PendingBooking } from '../bookings/pending-booking';
import { SentScreen } from '../feedback/sent-screen';
import { renderMarket } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { renderInShell, testClients } from '../test-shell';
import { HomeProvider } from './home-context';

afterEach(cleanup);

const sent = (onBack: () => void) => (
  <SentScreen icon="selected" title="Yuborildi" description="Rahmat" onBack={onBack} />
);

// G38 (owner decision 03.10.2026, docs/103): after a finished action «Назад» leads to the main
// screen, never back into the steps of the wizard.
describe('a finished action', () => {
  it('goes to the main screen when the app has one', () => {
    const home = vi.fn();
    const onBack = vi.fn();
    renderInShell(<HomeProvider value={home}>{sent(onBack)}</HomeProvider>);
    fireEvent.click(screen.getByText('Orqaga'));
    expect(home).toHaveBeenCalledOnce();
    expect(onBack).not.toHaveBeenCalled();
  });

  it('keeps its own way back outside the main screen', () => {
    const onBack = vi.fn();
    renderInShell(sent(onBack));
    fireEvent.click(screen.getByText('Orqaga'));
    expect(onBack).toHaveBeenCalledOnce();
  });

  // «Bosh sahifa» of a sent seat (G77, docs/168 B): the main screen, also when the booking came
  // from «Safar topish» of an empty list, «Oʻxshash safarlar» or «Sevimli» inside a section.
  it('«Bosh sahifa» of a sent seat goes to the main screen, not to the section that booked it', async () => {
    const section = vi.fn();
    function App() {
      const [home, setHome] = useState(false);
      if (home) return <p>main screen</p>;
      return (
        <HomeProvider value={() => setHome(true)}>
          <PlacesGate onBack={section}>
            <PendingBooking booking={booking} onBack={section} onCancel={section} onHome={section} />
          </PlacesGate>
        </HomeProvider>
      );
    }
    renderMarket(<App />, testClients({}));
    fireEvent.click(await screen.findByRole('button', { name: 'Bosh sahifa' }));
    expect(screen.getByText('main screen')).toBeTruthy();
    expect(section).not.toHaveBeenCalled();
  });
});
