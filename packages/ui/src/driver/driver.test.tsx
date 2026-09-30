import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { loadBrand } from '@platform/brands';
import { CAR_COLORS } from '@platform/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { application, car, renderGate, shoot, tap } from './driver-test-kit';

vi.mock('../account/profile/compress-image', () => ({ compressImage: async (file: Blob) => file }));
afterEach(cleanup);

describe('DriverGate: the application of a driver (docs/04)', () => {
  it('asks one question per screen and sends the application', async () => {
    const { submit, tracked, container } = renderGate(null);
    for (const step of ['Boshlash', 'Chevrolet', 'Cobalt', 'Oq']) await tap(step);
    // Only Latin capitals and digits stay in the plate, whatever the keyboard gives.
    const plate = screen.getByLabelText('Davlat raqami');
    fireEvent.change(plate, { target: { value: '01 a 123 bcЖ!' } });
    expect(screen.getByDisplayValue('01 A 123 BC')).toBeTruthy();
    await tap('Davom etish');
    // The seats of a Cobalt (4) are chosen in advance: "Davom etish" keeps them.
    expect(await screen.findByText('Yoʻlovchilar uchun nechta joy bor?')).toBeTruthy();
    await tap('Davom etish');
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
    // While the application is checked the driver looks around the app (owner decision 29.09.2026).
    expect(await screen.findByText('Ariza tekshirilmoqda')).toBeTruthy();
    expect(screen.getByTestId('driver-home')).toBeTruthy();
    expect(submit).toHaveBeenCalledWith(car);
    const steps = tracked.filter((event) => event.name === 'driver_application_step');
    expect(steps.map((event) => ('step' in event ? event.step : ''))).toEqual([
      'car',
      'color',
      'plate',
      'seats',
      'avatar',
      'photos',
      'submitted',
    ]);
  });

  it('has the seats of the chosen model ready: a Damas takes 6', async () => {
    const { submit, container } = renderGate(null);
    for (const step of ['Boshlash', 'Chevrolet', 'Damas', 'Oq']) await tap(step);
    fireEvent.change(screen.getByLabelText('Davlat raqami'), { target: { value: '01A123BC' } });
    for (const step of ['Davom etish', 'Davom etish', 'Davom etish']) await tap(step);
    for (const taken of [1, 2, 3]) {
      shoot(container, 'Rasmga olish');
      await waitFor(() => expect(screen.getAllByText('Qayta olish')).toHaveLength(taken));
    }
    await tap('Davom etish');
    await tap('Yuborish');
    await waitFor(() => expect(submit).toHaveBeenCalledWith({ ...car, model: 'Damas', seats: 6 }));
  });

  it('lets an approved driver in', async () => {
    renderGate(application({ status: 'approved', car, photos: { front: true, side: true, interior: true } }));
    expect(await screen.findByTestId('driver-home')).toBeTruthy();
    expect(screen.queryByText('Ariza tekshirilmoqda')).toBeNull();
  });

  it('has a paint dot for every car color', () => {
    const { carColors } = loadBrand().theme;
    expect(CAR_COLORS.filter((color) => !carColors[color])).toEqual([]);
  });
});
