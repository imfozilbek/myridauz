import { REQUEST_LINK, type RideRequest } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { offer } from '../bookings/booking-test-kit';
import { PASSENGER_ACTIONS } from '../home/home-test-actions';
import { renderHome } from '../home/home-test-kit';
import { sheetClosed } from '../home/sheet-closed';
import { PassengerHome } from '../home/passenger-home';
import { tap } from '../market/market-test-kit';

afterEach(cleanup);

const NOW = Date.parse('2026-10-01T05:00:00Z');
const open = { id: 'r1', status: 'open', date: '2026-10-02' } as RideRequest;

function passenger(
  offers = [offer],
  answerOffer = vi.fn(async () => ({ ...offer, status: 'accepted' as const })),
) {
  vi.setSystemTime(NOW);
  const shown = renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, {
    bookings: async () => [],
    asked: async () => [open],
    offers: async () => offers,
    sheet: true,
    answers: { answerOffer },
  });
  return { ...shown, answerOffer };
}

// «Yangi taklif» over the main screen of a passenger (G68, docs/122, mockup g68/8 «Taklif»).
describe('the sheet of a new offer (G68)', () => {
  it('says the driver, the car with its plate, the trip, how the driver picks up and the sum', async () => {
    passenger([{ ...offer, id: 'o11' }]);
    await tap('Takliflarni koʻrish');
    expect(await screen.findByText('Yangi taklif')).toBeTruthy();
    expect(screen.getByText('Jasur · ★ 4,8')).toBeTruthy();
    expect(screen.getByText('Oq Chevrolet Cobalt')).toBeTruthy();
    expect(screen.getByRole('img', { name: '01 A 123 BC' })).toBeTruthy();
    expect(screen.getByText('Ertaga 08:00 · Chilonzor → Fargʻona')).toBeTruthy();
    expect(screen.getByText('Uyingizdan olib ketadi')).toBeTruthy();
    expect(screen.getByText('2 joy')).toBeTruthy();
    expect(screen.getByText(/^Bir joy 95.000$/u)).toBeTruthy();
    expect(screen.getByText(/^190.000$/u)).toBeTruthy();
    // The block at the bottom stays under the sheet (G76, lesson 199); its buttons step aside.
    expect(document.querySelector('.home-dock')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Takliflarni koʻrish' })).toBeNull();
    await tap('Keyinroq');
    await sheetClosed();
    expect(await screen.findByRole('button', { name: 'Takliflarni koʻrish' })).toBeTruthy();
  });

  it('«Qabul qilish» books the seat in one tap and says so on top', async () => {
    const { answerOffer } = passenger([{ ...offer, id: 'o12' }]);
    await tap('Takliflarni koʻrish');
    await tap('Qabul qilish');
    expect(answerOffer).toHaveBeenCalledWith('o12', 'accept');
    expect(await screen.findByText('Taklif qabul qilindi. Joyingiz band.')).toBeTruthy();
    await sheetClosed();
  });

  it('two offers: one sheet, «Barcha takliflar (2)» opens the request with its offers', async () => {
    passenger([
      { ...offer, id: 'o13' },
      { ...offer, id: 'o14' },
    ]);
    await tap('Takliflarni koʻrish');
    // One request is one thing to answer: no «1 / 2» (mockup g68/8 «Taklif»).
    expect(await screen.findByText('Barcha takliflar (2)')).toBeTruthy();
    expect(screen.queryByText('1 / 2')).toBeNull();
    await tap('Barcha takliflar (2)');
    expect(await screen.findByText(`opened ${REQUEST_LINK}:r1`)).toBeTruthy();
    await sheetClosed();
  });
});
