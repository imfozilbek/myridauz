import { toCyrillic } from '@platform/i18n';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { approved, renderProfile } from '../account/profile/profile-test-kit';

afterEach(cleanup);

// Prod 14.11.2026: «Safar eʼlon qilish uchun haydovchi arizangiz tasdiqlangan boʻlishi kerak» twice on
// «Kanallar», at driver/requests/board: «Siz uchun» asked the requests of a driver not approved yet (G96).
describe('«Kanallar» of a driver whose application waits', () => {
  it('does not ask the requests of passengers, only the own trips', async () => {
    const requestBoard = vi.fn(async () => Promise.reject(new Error('trips.not_driver')));
    const myTrips = vi.fn(async () => []);
    const pending = { ...approved, application: { ...approved.application, status: 'pending' as const } };
    renderProfile(
      {},
      {
        clients: { market: { myTrips, requestBoard }, channels: { mine: async () => [] } },
        driver: pending,
      },
    );
    fireEvent.click(screen.getByText('Dilnoza'));
    fireEvent.click(await screen.findByText(toCyrillic('Kanallar')));
    await waitFor(() => expect(myTrips).toHaveBeenCalled());
    expect(requestBoard).not.toHaveBeenCalled();
  });
});
