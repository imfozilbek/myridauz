import { loadBrand } from '@platform/brands';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap, trip } from '../market/market-test-kit';
import { TripLink } from '../market/trip-link';
import { testClients } from '../test-shell';
import { AccountGate } from './account-gate';
import { fakeClient } from './account-test-kit';
import { addFace, passWelcome } from './registration/registration-test-kit';

vi.mock('../telegram/permissions', () => ({
  requestSignedContact: vi.fn(async () => 'contact=signed'),
  requestBotMessages: vi.fn(async () => true),
}));
vi.mock('./profile/compress-image', () => ({ compressImage: async (file: Blob) => file }));

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

const welcome = { logo: 'logo.svg', points: [{ icon: 'team', textKey: 'common.welcome.verified' }] } as const;
const BOOK = '1 ta joy band qilish';
// A trip of another driver: the new person is not its driver.
const other = { ...trip, driver: { ...trip.driver, id: 'another-driver' } };

// A new person from a channel post sees the trip first (G75, docs/124 Д, docs/158 Д): the
// registration comes with «Band qilish», then the same trip again, ready to book.
describe('a trip of a link before the registration', { timeout: 20_000 }, () => {
  it('shows the trip, registers on «Band qilish», then opens the trip again', async () => {
    window.history.replaceState(null, '', `/?tgWebAppStartParam=trip_${trip.id}`);
    const client = fakeClient({ state: 'unregistered', suggestedName: 'Dilnoza' });
    const { container } = renderMarket(
      <AccountGate app="passenger" client={client} welcome={welcome}>
        <TripLink enabled>
          <p>inside</p>
        </TripLink>
      </AccountGate>,
      testClients({ market: { trip: async () => other } }),
    );
    await tap(BOOK);
    expect(await screen.findByText(loadBrand().slogan)).toBeTruthy();
    await passWelcome();
    await addFace(container);
    fireEvent.click(screen.getByText('Ayol'));
    await act(async () => fireEvent.click(screen.getByText('Raqamni yuborish')));
    expect(await screen.findByText(BOOK)).toBeTruthy();
    expect(screen.queryByText('inside')).toBeNull();
  });
});
