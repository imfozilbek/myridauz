import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { application, car, renderGate, tap } from './driver-test-kit';

afterEach(() => {
  cleanup();
  localStorage.clear();
});
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

describe('ApplicationFlow: «Назад» of the application (docs/94 B4, F3, G62)', () => {
  it('a new application starts on the car, and «Назад» returns to the main screen', async () => {
    renderGate(null);
    expect(await screen.findByTestId('driver-home')).toBeTruthy();
    await tap('Haydovchi boʻlish');
    expect(await screen.findByText('Mashinangiz')).toBeTruthy();
    expect(screen.queryByTestId('driver-home')).toBeNull();
    await tap('Orqaga');
    expect(await screen.findByText('Haydovchi boʻlish')).toBeTruthy();
    expect(screen.getByTestId('driver-home')).toBeTruthy();
    expect(asked).not.toHaveBeenCalled();
  });

  it('«Oʻzgartirish» and «Назад» of the photos go to the car with its answers', async () => {
    renderGate(null);
    await tap('Haydovchi boʻlish');
    await tap('Cobalt');
    fireEvent.click(screen.getByRole('button', { name: 'Oq' }));
    fireEvent.change(screen.getByLabelText('Davlat raqami'), { target: { value: '01A123BC' } });
    await tap('Davom etish');
    await tap('Oʻzgartirish');
    expect(await screen.findByText('Mashinangiz')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cobalt' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByDisplayValue('01 A 123 BC')).toBeTruthy();
    await tap('Davom etish');
    await tap('Orqaga');
    expect(await screen.findByText('Mashinangiz')).toBeTruthy();
  });

  it('B4: «Назад» out of a fix goes to the main screen, the note there opens the fix again', async () => {
    toFix();
    await screen.findByText('Mashinangiz');
    await tap('Orqaga');
    expect(await screen.findByText('Arizada tuzatish kerak')).toBeTruthy();
    expect(screen.getByTestId('driver-home')).toBeTruthy();
    await tap('Arizada tuzatish kerak');
    expect(await screen.findByText('Mashinangiz')).toBeTruthy();
  });

  it('B4: a photo fix opens on the photos, «Назад» goes straight to the main screen', async () => {
    renderGate(
      application({
        status: 'changes_requested',
        car,
        reasons: ['side_unclear'],
        photos: { front: true, side: true, interior: true },
      }),
    );
    expect(await screen.findByText('Bitta rasmni almashtiring')).toBeTruthy();
    await tap('Orqaga');
    expect(await screen.findByText('Arizada tuzatish kerak')).toBeTruthy();
    expect(screen.queryByText('Mashinangiz')).toBeNull();
  });

  it('F3: leaving with a changed car asks first and stays on «no»', async () => {
    toFix();
    asked.mockReturnValue(false);
    fireEvent.change(await screen.findByDisplayValue('01 A 123 BC'), { target: { value: '01A124BC' } });
    await tap('Orqaga');
    expect(asked).toHaveBeenCalledWith('Oʻzgarishlar saqlanmaydi. Chiqasizmi?');
    expect(screen.getByText('Mashinangiz')).toBeTruthy();
  });
});
