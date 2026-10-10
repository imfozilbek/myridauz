import { ApiError } from '@platform/api-client';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { loadBrand } from '@platform/brands';
import { CAR_COLORS } from '@platform/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { application, car, renderGate, shoot, tap } from './driver-test-kit';

vi.mock('../account/profile/compress-image', () => ({ compressImage: async (file: Blob) => file }));
afterEach(() => {
  cleanup();
  localStorage.clear();
});

const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
const taken = (tile: string) =>
  screen.getByText(tile, { exact: true }).closest('button')?.dataset['taken'] === 'true';

describe('DriverGate: the application of a driver in 2 screens (G62, docs/118 path 5)', () => {
  it('asks the car on one screen, the 3 car photos on the next and sends from there', async () => {
    const { submit, tracked, container } = renderGate(null);
    await tap('Arizani toʻldirish');
    expect(await screen.findByText('Mashinangiz')).toBeTruthy();
    expect(screen.getByText('1 / 2')).toBeTruthy();
    // Nothing is chosen yet: «Davom etish» waits for the whole car.
    expect(button('Davom etish').disabled).toBe(true);
    await tap('Cobalt');
    fireEvent.click(button('Oq'));
    expect(screen.getByText('Rang · Oq')).toBeTruthy();
    // Only Latin capitals and digits stay in the plate, whatever the keyboard gives.
    fireEvent.change(screen.getByLabelText('Davlat raqami'), { target: { value: '01a123bcЖ!' } });
    expect(screen.getByDisplayValue('01 A 123 BC')).toBeTruthy();
    // A Cobalt takes 4 passengers: «+» stops there, «−» gives fewer.
    expect(screen.getByText('4')).toBeTruthy();
    expect(button('Oshirish').disabled).toBe(true);
    fireEvent.click(button('Kamaytirish'));
    expect(screen.getByText('3')).toBeTruthy();
    await tap('Davom etish');
    // The photos: the car and its plate on top, no face (it is taken at the registration).
    expect(await screen.findByText('Mashina rasmlari')).toBeTruthy();
    expect(screen.getByText('2 / 2 · kunduzi, raqam aniq koʻrinsin')).toBeTruthy();
    expect(screen.getByText('Cobalt, Oq · 3 joy')).toBeTruthy();
    expect(screen.getByRole('img', { name: '01 A 123 BC' })).toBeTruthy();
    expect(screen.queryByText('Yuzingiz')).toBeNull();
    expect(button('Arizani yuborish').disabled).toBe(true);
    for (const tile of ['Old tomondan', 'Yon tomondan', 'Salon']) {
      shoot(container, tile);
      await waitFor(() => expect(taken(tile)).toBe(true));
    }
    // The server misses a photo: the driver reads what to do, not «try later» (docs/86 T7).
    submit.mockRejectedValueOnce(new ApiError(409, 'drivers.incomplete'));
    await tap('Arizani yuborish');
    expect(await screen.findByText(/^Arizada hamma rasmlar/)).toBeTruthy();
    await tap('Arizani yuborish');
    // No «Ariza yuborildi»: the main screen says it is checked (G62).
    expect(await screen.findByText('Tekshiruvdan keyin ochiladi. Odatda 30 daqiqagacha.')).toBeTruthy();
    expect(screen.queryByText('Ariza yuborildi')).toBeNull();
    expect(screen.getByTestId('driver-home')).toBeTruthy();
    expect(submit).toHaveBeenCalledWith({ ...car, seats: 3 });
    const steps = tracked.filter((event) => event.name === 'driver_application_step');
    expect(steps.map((event) => ('step' in event ? event.step : ''))).toEqual(['car', 'photos', 'submitted']);
  });

  it('finds another car in «Boshqa ›» and takes a typed one with its seats up to the limit', async () => {
    const { submit, container } = renderGate(null);
    await tap('Arizani toʻldirish');
    await tap('Boshqa ›');
    const sheet = within(await screen.findByRole('dialog'));
    fireEvent.change(sheet.getByPlaceholderText('Marka yoki model'), { target: { value: 'sor' } });
    fireEvent.click(sheet.getByText('Kia Sorento'));
    // The chosen car joins the buttons, with its seats.
    expect(await screen.findByText('Sorento')).toBeTruthy();
    expect(screen.getByText('6')).toBeTruthy();
    await tap('Boshqa ›');
    const typed = within(await screen.findByRole('dialog'));
    fireEvent.change(typed.getByPlaceholderText('Marka yoki model'), { target: { value: 'Grafter' } });
    // One word is not a car: the make and the model are both needed.
    expect(typed.getByText(/^Marka va modelni yozing/)).toBeTruthy();
    fireEvent.change(typed.getByPlaceholderText('Marka yoki model'), { target: { value: 'Isuzu  Grafter' } });
    fireEvent.click(typed.getByText('«Isuzu Grafter» qoʻshish'));
    expect(await screen.findByText('Isuzu Grafter')).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    // A typed car starts at 4 seats and may go up to the limit of the app.
    for (let more = 0; more < 3; more += 1) fireEvent.click(button('Oshirish'));
    expect(button('Oshirish').disabled).toBe(true);
    fireEvent.click(button('Oq'));
    fireEvent.change(screen.getByLabelText('Davlat raqami'), { target: { value: '10123ABC' } });
    await tap('Davom etish');
    for (const tile of ['Old tomondan', 'Yon tomondan', 'Salon']) {
      shoot(container, tile);
      await waitFor(() => expect(taken(tile)).toBe(true));
    }
    await tap('Arizani yuborish');
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith({
        ...car,
        make: 'Isuzu',
        model: 'Grafter',
        plate: '10123ABC',
        seats: 7,
      }),
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
