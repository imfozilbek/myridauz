import type { Trip } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap, trip } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { testClients } from '../test-shell';
import { SafarScreen } from './safar-screen';
import type { SeatChoice } from './seat-choice';

afterEach(cleanup);

const REVIEWS = {
  rating: { average: 4.8, count: 37 },
  reviews: [{ id: 'r1', authorName: 'Dilnoza', stars: 5, tags: [], text: 'Yaxshi haydaydi', at: 1 }],
};
const open = (shown: Trip, gender: 'male' | 'female' = 'male') => {
  const onBook = vi.fn<(choice: SeatChoice) => void>();
  renderMarket(
    <PlacesGate>
      <SafarScreen trip={shown} onBack={() => undefined} onBook={onBook} />
    </PlacesGate>,
    testClients({ feedback: { reviewsOf: async () => REVIEWS } }),
    gender,
  );
  return onBook;
};
const more = () => fireEvent.click(screen.getByRole('button', { name: 'Oshirish' }));

describe('«Safar» of a passenger (G59, docs/118 path 2)', { timeout: 20_000 }, () => {
  it('shows the driver with the plate, one review and «Barcha izohlar (N) ›»', async () => {
    open(trip);
    expect(await screen.findByRole('img', { name: '01 A 123 BC' })).toBeTruthy();
    expect(await screen.findByText('«Yaxshi haydaydi»')).toBeTruthy();
    await tap('Barcha izohlar (37) ›');
    expect(await screen.findByText(/Dilnoza/u)).toBeTruthy();
  });

  it('counts the seats up to the free ones only, and «Jami» is the seats × the share (docs/128 §2)', async () => {
    const onBook = open({ ...trip, seats: 7, seatsLeft: 2 });
    await screen.findByText('Necha kishi ketadi?');
    more();
    more();
    expect(screen.getByText('2')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Oshirish' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/190\s000/u)).toBeTruthy();
    await tap('2 ta joy band qilish');
    expect(onBook).toHaveBeenCalledWith({ seats: 2, wholeCar: false, withWoman: false });
  });

  it('offers «Men bilan ayol bor» to a man of 2 seats on a trip without the mark (docs/06 p. 4)', async () => {
    const onBook = open({ ...trip, woman: false });
    await screen.findByText('Necha kishi ketadi?');
    expect(screen.queryByText('Men bilan ayol bor')).toBeNull();
    more();
    fireEvent.click(await screen.findByRole('checkbox'));
    await tap('2 ta joy band qilish');
    expect(onBook).toHaveBeenCalledWith({ seats: 2, wholeCar: false, withWoman: true });
  });

  it('never offers it on a trip with «Mashinada ayol bor», nor to a woman', async () => {
    open(trip);
    await screen.findByText('Necha kishi ketadi?');
    more();
    expect(screen.queryByText('Men bilan ayol bor')).toBeNull();
    cleanup();
    open({ ...trip, woman: false }, 'female');
    await screen.findByText('Necha kishi ketadi?');
    more();
    expect(screen.queryByText('Men bilan ayol bor')).toBeNull();
  });

  it('books the whole car: «Joylar / Butun salon», or «Faqat butun salon» (docs/09)', async () => {
    const onBook = open({ ...trip, bookingRule: 'seats_or_car' });
    await tap('Butun salon');
    expect(screen.getByText('3 joy')).toBeTruthy();
    expect(screen.getByText(/285\s000/u)).toBeTruthy();
    await tap('Butun salonni band qilish');
    expect(onBook).toHaveBeenCalledWith({ seats: 3, wholeCar: true, withWoman: false });
    cleanup();
    open({ ...trip, bookingRule: 'car_only' });
    expect(await screen.findByText('Faqat butun salon')).toBeTruthy();
    expect(screen.queryByRole('tab')).toBeNull();
  });
});
