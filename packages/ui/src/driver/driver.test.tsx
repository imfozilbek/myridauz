import { ApiError } from '@platform/api-client';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { loadBrand } from '@platform/brands';
import { CAR_COLORS } from '@platform/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { application, car, renderGate, shoot, tap } from './driver-test-kit';

vi.mock('../account/profile/compress-image', () => ({ compressImage: async (file: Blob) => file }));
afterEach(() => {
  cleanup();
  localStorage.clear();
});

const progress = () => Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'));
const rowOf = (label: string) => screen.getByText(label, { exact: true }).closest('[role="button"]');

describe('DriverGate: the application of a driver (docs/04, G34)', () => {
  it('asks one question per screen, takes all photos on one screen and sends the application', async () => {
    const { submit, tracked, container } = renderGate(null, false);
    // A new driver lands on the main screen: the card opens the application (G34).
    await tap('Arizani toʻldiring');
    for (const step of ['Chevrolet', 'Cobalt', 'Oq']) await tap(step);
    // How much of the application is filled (docs/88 L4).
    expect(progress()).toBeGreaterThan(0);
    // Only Latin capitals and digits stay in the plate, whatever the keyboard gives.
    fireEvent.change(screen.getByLabelText('Davlat raqami'), { target: { value: '01 a 123 bcЖ!' } });
    expect(screen.getByDisplayValue('01 A 123 BC')).toBeTruthy();
    await tap('Davom etish');
    // A Cobalt has 4 seats: no seats question, the photos are next, the face first.
    expect(screen.queryByText('Yoʻlovchilar uchun nechta joy bor?')).toBeNull();
    expect(screen.getByText('Rasmlar')).toBeTruthy();
    expect(screen.getByText('Raqam aniq koʻrinsin')).toBeTruthy();
    shoot(container, 'Rasmga olish', 'user');
    await waitFor(() => expect(screen.getAllByText('Qayta olish')).toHaveLength(1));
    expect(screen.queryByText('Davom etish')).toBeNull();
    for (const taken of [2, 3, 4]) {
      shoot(container, 'Rasmga olish');
      await waitFor(() => expect(screen.getAllByText('Qayta olish')).toHaveLength(taken));
    }
    await tap('Davom etish');
    expect(await screen.findByText('01 A 123 BC')).toBeTruthy();
    // Every line of the review has its icon; the color its paint dot (G34).
    for (const label of ['Mashina', 'Davlat raqami', 'Joylar', 'Yuzingiz rasmi', 'Mashina rasmlari'])
      expect(rowOf(label)?.querySelector('svg')).toBeTruthy();
    expect(rowOf('Mashina rangi')?.querySelector('.swatch-tile')).toBeTruthy();
    // The server misses a photo: the driver reads what to do, not «try later» (docs/86 T7).
    submit.mockRejectedValueOnce(new ApiError(409, 'drivers.incomplete'));
    await tap('Yuborish');
    expect(await screen.findByText(/^Arizada hamma rasmlar/)).toBeTruthy();
    await tap('Yuborish');
    // When the answer comes, in the hours of the team from the brand (G34).
    expect(await screen.findByText('Ariza yuborildi')).toBeTruthy();
    expect(screen.getByText(/soat 7:00 dan 23:00 gacha/)).toBeTruthy();
    await tap('Davom etish');
    // While the application is checked the driver looks around the app (owner decision 29.09.2026).
    expect(await screen.findByText('Arizangiz tekshirilmoqda')).toBeTruthy();
    expect(screen.getByTestId('driver-home')).toBeTruthy();
    expect(submit).toHaveBeenCalledWith(car);
    const steps = tracked.filter((event) => event.name === 'driver_application_step');
    expect(steps.map((event) => ('step' in event ? event.step : ''))).toEqual([
      'car',
      'color',
      'plate',
      'photos',
      'submitted',
    ]);
  });

  it('takes a popular car by one tap and asks seats only for a typed model', async () => {
    const { submit, container } = renderGate(null);
    await tap('Arizani toʻldiring');
    // The seats are next to each model (owner decision 30.09.2026).
    expect(screen.getByText('Ommabop modellar')).toBeTruthy();
    expect(screen.getAllByText('6 ta joy')).toHaveLength(1);
    // Every choice has an icon in front, «Boshqa» too (G34).
    expect(rowOf('Chevrolet Damas')?.querySelector('svg')).toBeTruthy();
    expect(rowOf('Boshqa')?.querySelector('svg')).toBeTruthy();
    await tap('Chevrolet Damas');
    expect(await screen.findByText('Mashina rangi')).toBeTruthy();
    expect(rowOf('Oq')?.querySelector('.swatch-tile')).toBeTruthy();
    await tap('Oq');
    fireEvent.change(screen.getByLabelText('Davlat raqami'), { target: { value: '01A123BC' } });
    await tap('Davom etish');
    // The face is already in the profile: only the car is left.
    for (const taken of [2, 3, 4]) {
      shoot(container, 'Rasmga olish');
      await waitFor(() => expect(screen.getAllByText('Qayta olish')).toHaveLength(taken));
    }
    await tap('Davom etish');
    expect(await screen.findByText('Chevrolet Damas')).toBeTruthy();
    // A typed model has no seats in the list: the driver answers the seats question.
    await tap('Mashina');
    await tap('Boshqa');
    fireEvent.change(screen.getByPlaceholderText('Nomini yozing'), { target: { value: 'Isuzu' } });
    await tap('Davom etish');
    fireEvent.change(screen.getByPlaceholderText('Nomini yozing'), { target: { value: 'Grafter' } });
    await tap('Davom etish');
    await tap('Oq');
    await tap('Davom etish');
    expect(await screen.findByText('Yoʻlovchilar uchun nechta joy bor?')).toBeTruthy();
    expect(rowOf('7')?.querySelector('svg')).toBeTruthy();
    await tap('7');
    for (const step of ['Davom etish', 'Yuborish']) await tap(step);
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith({ ...car, make: 'Isuzu', model: 'Grafter', seats: 7 }),
    );
  });

  it('lets an approved driver in', async () => {
    renderGate(application({ status: 'approved', car, photos: { front: true, side: true, interior: true } }));
    expect(await screen.findByTestId('driver-home')).toBeTruthy();
    expect(screen.queryByText('Arizangiz tekshirilmoqda')).toBeNull();
  });

  it('has a paint dot for every car color', () => {
    const { carColors } = loadBrand().theme;
    expect(CAR_COLORS.filter((color) => !carColors[color])).toEqual([]);
  });
});
