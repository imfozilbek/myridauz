import type { MarketClient } from '@platform/api-client';
import { DAY_MS, tashkentDate, tashkentDayStart } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DriverContext, type Driver } from '../driver/driver-context';
import { testClients } from '../test-shell';
import { chooseRoute, recommendation, renderMarket, tap, trip } from './market-test-kit';
import { NewTripFlow } from './new-trip-flow';

afterEach(cleanup);

const HOUR = 60 * 60 * 1000;
const driver: Driver = {
  application: {
    status: 'approved',
    car: { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 },
    photos: { front: true, side: true, interior: true },
    reasons: [],
  },
  editCar: () => undefined,
};

function setup(gender: 'male' | 'female' = 'male', status: Driver['application']['status'] = 'approved') {
  const publishTrip = vi.fn<MarketClient['publishTrip']>(async () => trip);
  const clients = testClients({ market: { recommend: async () => recommendation, publishTrip } });
  const result = renderMarket(
    <DriverContext.Provider value={{ ...driver, application: { ...driver.application, status } }}>
      <NewTripFlow onBack={() => undefined} />
    </DriverContext.Provider>,
    clients,
    gender,
  );
  return { ...result, publishTrip };
}

describe('NewTripFlow: a new trip, one question per screen (docs/19)', () => {
  it('asks the route, day, time, seats, price, woman, comment and publishes', async () => {
    const { publishTrip, tracked } = setup();
    await chooseRoute();
    await tap('Shahar boʻylab yigʻaman');
    await tap(/^Ertaga/);
    // A thin bar on top: how much of the trip is filled (docs/88 L4).
    const filled = async () => Number((await screen.findByRole('progressbar')).getAttribute('aria-valuenow'));
    const atTime = await filled();
    expect(atTime).toBeGreaterThan(0);
    await tap('Davom etish');
    // The seats of the car are chosen in advance.
    expect(await screen.findByText('Nechta boʻsh joy bor?')).toBeTruthy();
    await tap('Davom etish');
    // The price field is filled with the recommendation; + adds one step.
    expect(await screen.findByText(/Tavsiya: 95/)).toBeTruthy();
    // The commission per seat by the rule of the brand, like the backend takes it (docs/86 V8).
    expect(screen.getByText(/^Har bir joy uchun 9\s500\ssoʻm komissiya$/u)).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Oshirish'));
    expect(screen.getByText(/^Har bir joy uchun 10\s000\ssoʻm komissiya$/u)).toBeTruthy();
    await tap('Davom etish');
    await tap('Yoʻq');
    expect((await screen.findByPlaceholderText('Izoh yozing')).tagName).toBe('TEXTAREA');
    expect(await filled()).toBeGreaterThan(atTime);
    await tap('Izohsiz davom etish');
    expect(await screen.findByText(/^Har bir joy uchun 10\s000\ssoʻm komissiya$/u)).toBeTruthy();
    await tap('Eʼlon qilish');
    expect(await screen.findByText('Safar eʼlon qilindi')).toBeTruthy();
    const departAt = tashkentDayStart(tashkentDate(Date.now() + DAY_MS)) + 8 * HOUR;
    expect(publishTrip).toHaveBeenCalledWith({
      from: '1726269',
      pickupMode: 'door',
      to: '1730401',
      departAt,
      seats: 4,
      price: 100000,
      womanOnBoard: false,
      comment: '',
    });
    const steps = tracked
      .filter((event) => event.name === 'trip_step')
      .map((event) => ('step' in event ? event.step : ''));
    expect(steps).toEqual([
      'route',
      'mode',
      'date',
      'time',
      'seats',
      'price',
      'woman',
      'comment',
      'published',
    ]);
  });

  it('skips the woman question for a woman driver and shows an error of the API', async () => {
    const { publishTrip } = setup('female');
    publishTrip.mockRejectedValueOnce(new Error('offline'));
    await chooseRoute();
    await tap('Shahar boʻylab yigʻaman');
    for (const step of [
      /^Ertaga/,
      'Davom etish',
      'Davom etish',
      'Davom etish',
      'Izohsiz davom etish',
      'Eʼlon qilish',
    ])
      await tap(step);
    expect(await screen.findByText('Birozdan keyin qayta urinib koʻring.')).toBeTruthy();
    expect(screen.queryByText('Mashinada ayol bormi?')).toBeNull();
  });

  it('lets a driver whose application is checked try everything but publishing', async () => {
    const { publishTrip } = setup('male', 'pending');
    await chooseRoute();
    await tap('Shahar boʻylab yigʻaman');
    for (const step of [
      /^Ertaga/,
      'Davom etish',
      'Davom etish',
      'Davom etish',
      'Yoʻq',
      'Izohsiz davom etish',
    ])
      await tap(step);
    expect(await screen.findByText('Ariza tasdiqlangach safarni eʼlon qila olasiz.')).toBeTruthy();
    expect(screen.queryByText('Eʼlon qilish')).toBeNull();
    expect(publishTrip).not.toHaveBeenCalled();
  });
});
