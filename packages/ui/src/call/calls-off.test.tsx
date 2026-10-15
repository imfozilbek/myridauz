import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { DriverBooking } from '../bookings/driver-booking';
import { useTalkTools } from '../home/dock/talk-tools';
import { renderMarket } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { renderInShell, testClients } from '../test-shell';
import { CallsOnContext } from './calls-on';

afterEach(cleanup);
const noop = () => undefined;
function Tools() {
  const { tools, phone } = useTalkTools(noop, noop, false);
  return <p>{[...tools, ...phone].map((tool) => tool.icon).join(' ')}</p>;
}

// Without Realtime on the server no call button shows: a tap would only fail (G52, docs/112).
describe('calls that are not set up', () => {
  it('leaves only the chat next to the person of a seat', () => {
    renderInShell(
      <CallsOnContext.Provider value={false}>
        <Tools />
      </CallsOnContext.Provider>,
    );
    expect(screen.getByText('chat')).toBeTruthy();
  });

  it('shows no «Qoʻngʻiroq» on a confirmed seat of the driver', async () => {
    renderMarket(
      <CallsOnContext.Provider value={false}>
        <PlacesGate>
          <DriverBooking booking={confirmed} onClose={noop} />
        </PlacesGate>
      </CallsOnContext.Provider>,
      testClients({}),
    );
    expect(await screen.findByText('Xabar yozish')).toBeTruthy();
    expect(screen.queryByText('Qoʻngʻiroq')).toBeNull();
  });
});
