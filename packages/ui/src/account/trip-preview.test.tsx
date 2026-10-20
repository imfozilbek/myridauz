import { ApiError } from '@platform/api-client';
import { loadBrand } from '@platform/brands';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap, trip } from '../market/market-test-kit';
import { TripLink } from '../market/trip-link';
import { testClients } from '../test-shell';
import { AccountGate } from './account-gate';
import { fakeClient } from './account-test-kit';
import { addFace, passWelcome } from './registration/registration-test-kit';
import { TripPreview } from './trip-preview';

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
const BOOK = '2 ta joy band qilish';
// A trip of another driver: the new person is not its driver.
const other = { ...trip, driver: { ...trip.driver, id: 'another-driver' } };

// A new person from a channel post sees the trip first (G75, docs/124 Д, docs/158 Д): the
// registration comes with «Band qilish», then the booking with the seats chosen before (G79 П5,
// 2+ taps → 0).
describe('a trip of a link before the registration', { timeout: 20_000 }, () => {
  it('shows the trip, registers on «Band qilish», then books the seats chosen before', async () => {
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
    fireEvent.click(await screen.findByRole('button', { name: 'Oshirish' }));
    await tap(BOOK);
    expect(await screen.findByText(loadBrand().slogan)).toBeTruthy();
    await passWelcome();
    await addFace(container);
    fireEvent.click(screen.getByText('Ayol'));
    await act(async () => fireEvent.click(screen.getByText('Raqamni yuborish')));
    expect(await screen.findByText('Qayerdan, qayerga?')).toBeTruthy();
    expect(screen.getByText(/^2 joy × 95[\s.]000$/u)).toBeTruthy();
    expect(screen.queryByText('inside')).toBeNull();
  });

  // G90 PAS-6: «Qayta urinish» of a trip that did not open tries it again; it never starts the
  // registration in its place.
  it('tries the trip again on «Qayta urinish»', async () => {
    const onDone = vi.fn();
    const failing = vi.fn(async () => Promise.reject(new ApiError(0, 'network.failed')));
    renderMarket(<TripPreview id="t1" onDone={onDone} />, testClients({ market: { trip: failing } }));
    fireEvent.click(await screen.findByText('Qayta urinish'));
    await waitFor(() => expect(failing).toHaveBeenCalledTimes(2));
    expect(onDone).not.toHaveBeenCalled();
  });
});
