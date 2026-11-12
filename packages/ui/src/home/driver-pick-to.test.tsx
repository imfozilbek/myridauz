import { toCyrillic } from '@platform/i18n';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { markApprovalSeen } from '../driver/approval-seen';
import { tap } from '../market/market-test-kit';
import { DriverHome } from './driver-home';
import { DRIVER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';

const location = vi.hoisted(() => ({
  herePosition: vi.fn(async (): Promise<{ lat: number; lng: number } | null> => ({ lat: 41.3, lng: 69.2 })),
}));
vi.mock('../telegram/location', () => location);
beforeEach(markApprovalSeen);
afterEach(() => {
  cleanup();
  localStorage.clear();
});

const driver = () =>
  renderHome(() => <DriverHome />, DRIVER_ACTIONS, {
    trips: async () => [],
    requests: async () => [],
    where: true,
  });
const REQUESTS = toCyrillic('Ertaga 2 ta soʻrov');
const OTHER = toCyrillic('Boshqa joy: tuman yoki shahar');

// One «Qayerga» for both roles (owner decision 12.11.2026, docs/118): the driver sees the requests.
describe('«Qayerga» of a driver', { timeout: 20_000 }, () => {
  it('opens the districts of a region and goes back to the regions from them', async () => {
    driver();
    await screen.findByText(toCyrillic('Joylashuvingiz boʻyicha aniqlandi'));
    await tap(toCyrillic('Qayerga ketyapsiz?'));
    expect(await screen.findByText(REQUESTS)).toBeTruthy();
    expect(screen.getByText(OTHER)).toBeTruthy();
    await tap(toCyrillic('Fargʻona'));
    expect(await screen.findByText(toCyrillic('Butun viloyat'))).toBeTruthy();
    await tap(toCyrillic('Orqaga'));
    expect(await screen.findByText(REQUESTS)).toBeTruthy();
  });

  it('asks «Qayerdan» first when it is not known, then the search picks a place at once', async () => {
    location.herePosition.mockResolvedValue(null);
    driver();
    await tap(toCyrillic('Qayerga ketyapsiz?'));
    expect(await screen.findByText(toCyrillic('Qayerdan yoʻlga chiqasiz?'))).toBeTruthy();
    await tap(toCyrillic('Toshkent shahri'));
    await tap(toCyrillic('Chilonzor'));
    expect(await screen.findByText(toCyrillic('Chilonzor, Toshkentdan'))).toBeTruthy();
    await tap(OTHER);
    fireEvent.change(screen.getByPlaceholderText(OTHER), { target: { value: 'Farg' } });
    fireEvent.click(await screen.findByText(toCyrillic('ona shahri'), { exact: false }));
    // Back on the main screen the block keeps both ends.
    const line = (end: string) => screen.getByText(toCyrillic(end)).closest('button')?.textContent;
    await waitFor(() => expect(line('Qayerga')).toContain(toCyrillic('Fargʻona shahri')));
    expect(line('Qayerdan')).toContain(toCyrillic('Chilonzor'));
    location.herePosition.mockResolvedValue({ lat: 41.3, lng: 69.2 });
  });
});
