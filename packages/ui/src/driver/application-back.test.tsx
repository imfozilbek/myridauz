import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { application, car, renderGate, tap } from './driver-test-kit';

afterEach(cleanup);
const asked = vi.spyOn(window, 'confirm');
beforeEach(() => asked.mockReset());

const toFix = () =>
  renderGate(
    application({
      status: 'changes_requested',
      car,
      reasons: ['plate_mismatch'],
      photos: { front: true, side: true, interior: true },
    }),
  );

describe('ApplicationFlow: «Назад» of the application (docs/94 B4, B5, F3)', () => {
  it('B4: fixing an application has «Назад» to its status', async () => {
    toFix();
    await tap('Tuzatish');
    expect(await screen.findByText('Arizani tekshiring')).toBeTruthy();
    await tap('Orqaga');
    expect(await screen.findByText('Davlat raqami rasmdagiga mos emas')).toBeTruthy();
    expect(screen.queryByText('Arizani tekshiring')).toBeNull();
  });

  it('B5: a new make and «Назад» on its model keeps the car as it was', async () => {
    toFix();
    await tap('Tuzatish');
    await tap('Mashina');
    await tap('Lada');
    expect(await screen.findByText('Granta')).toBeTruthy();
    await tap('Orqaga');
    expect(await screen.findByText('Chevrolet Cobalt')).toBeTruthy();
    expect(screen.queryByText('Lada Cobalt')).toBeNull();
    await tap('Mashina');
    await tap('Lada');
    await tap('Granta');
    expect(await screen.findByText('Lada Granta')).toBeTruthy();
  });

  it('F3: leaving with a changed car asks first and stays on «no»', async () => {
    toFix();
    asked.mockReturnValue(false);
    await tap('Tuzatish');
    await tap('Davlat raqami');
    fireEvent.change(screen.getByDisplayValue('01 A 123 BC'), { target: { value: '01 A 124 BC' } });
    await tap('Davom etish');
    await tap('Orqaga');
    expect(asked).toHaveBeenCalledWith('Oʻzgarishlar saqlanmaydi. Chiqasizmi?');
    expect(screen.getByText('Arizani tekshiring')).toBeTruthy();
  });
});
