import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { application, car, renderGate, shoot, tap } from './driver-test-kit';

vi.mock('../account/profile/compress-image', () => ({ compressImage: async (file: Blob) => file }));
afterEach(cleanup);

describe('DriverGate: the application of a driver (docs/04)', () => {
  it('asks one question per screen and sends the application', async () => {
    const { submit, tracked, container } = renderGate(null);
    for (const step of ['Boshlash', 'Chevrolet', 'Cobalt', 'Oq', '2020']) await tap(step);
    fireEvent.change(screen.getByPlaceholderText('01 A 123 BC'), {
      target: { value: '01 a 123 bc' },
    });
    await tap('Davom etish');
    await tap('4');
    await tap('Davom etish');
    // Each photo has a frame with a hint of what to shoot until it is taken.
    expect(screen.getByText('Raqam aniq koʻrinsin')).toBeTruthy();
    for (const taken of [1, 2, 3]) {
      shoot(container, 'Rasmga olish');
      await waitFor(() => expect(screen.getAllByText('Qayta olish')).toHaveLength(taken));
    }
    await tap('Davom etish');
    expect(await screen.findByText('01 A 123 BC')).toBeTruthy();
    await tap('Yuborish');
    expect(await screen.findByText('Ariza tekshirilmoqda')).toBeTruthy();
    expect(submit).toHaveBeenCalledWith(car);
    const steps = tracked.filter((event) => event.name === 'driver_application_step');
    expect(steps.map((event) => ('step' in event ? event.step : ''))).toEqual([
      'car',
      'color',
      'year',
      'plate',
      'seats',
      'avatar',
      'photos',
      'submitted',
    ]);
  });

  it('lets an approved driver in', async () => {
    renderGate(application({ status: 'approved', car, photos: { front: true, side: true, interior: true } }));
    expect(await screen.findByTestId('driver-home')).toBeTruthy();
  });
});
