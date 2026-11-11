import { toCyrillic } from '@platform/i18n';
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
      photos: { front: true },
    }),
  );

describe('ApplicationFlow: «Назад» of the application (docs/94 B4, F3, G62)', () => {
  it('a new application starts on the car, and «Назад» returns to the main screen', async () => {
    renderGate(null);
    expect(await screen.findByTestId('driver-home')).toBeTruthy();
    await tap(toCyrillic('Arizani toʻldirish'));
    expect(await screen.findByText(toCyrillic('Mashinangiz'))).toBeTruthy();
    // The main screen waits under the form as it was, not seen (G77).
    expect(screen.getByTestId('driver-home').closest('.kept-behind')).not.toBeNull();
    await tap(toCyrillic('Orqaga'));
    expect(await screen.findByText(toCyrillic('Arizani toʻldirish'))).toBeTruthy();
    expect(screen.getByTestId('driver-home').closest('.kept-behind')).toBeNull();
    expect(asked).not.toHaveBeenCalled();
  });

  it('«Oʻzgartirish» and «Назад» of the photos go to the car with its answers', async () => {
    renderGate(null);
    await tap(toCyrillic('Arizani toʻldirish'));
    await tap('Cobalt');
    fireEvent.click(screen.getByRole('button', { name: toCyrillic('Oq') }));
    fireEvent.change(screen.getByLabelText(toCyrillic('Davlat raqami')), { target: { value: '01A123BC' } });
    await tap(toCyrillic('Davom etish'));
    await tap(toCyrillic('Oʻzgartirish'));
    expect(await screen.findByText(toCyrillic('Mashinangiz'))).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cobalt' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByDisplayValue('01 A 123 BC')).toBeTruthy();
    await tap(toCyrillic('Davom etish'));
    await tap(toCyrillic('Orqaga'));
    expect(await screen.findByText(toCyrillic('Mashinangiz'))).toBeTruthy();
  });

  it('B4: «Назад» out of a fix goes to the main screen, the note there opens the fix again', async () => {
    toFix();
    await screen.findByText(toCyrillic('Mashinangiz'));
    await tap(toCyrillic('Orqaga'));
    expect(await screen.findByText(toCyrillic('Tuzatish kerak'))).toBeTruthy();
    expect(screen.getByTestId('driver-home')).toBeTruthy();
    // Not a photo: the block asks to fix the marked places (G62).
    expect(
      screen.getByText(toCyrillic('Qizil bilan belgilangan joylarni tuzating va qayta yuboring.')),
    ).toBeTruthy();
    await tap(toCyrillic('Tuzatish'));
    expect(await screen.findByText(toCyrillic('Mashinangiz'))).toBeTruthy();
  });

  it('B4: a photo fix opens on the photos, «Назад» goes straight to the main screen', async () => {
    renderGate(
      application({
        status: 'changes_requested',
        car,
        reasons: ['front_unclear'],
        photos: { front: true },
      }),
    );
    expect(await screen.findByText(toCyrillic('Bitta rasmni almashtiring'))).toBeTruthy();
    await tap(toCyrillic('Orqaga'));
    expect(await screen.findByText(toCyrillic('Tuzatish kerak'))).toBeTruthy();
    // The block says the reason and how many photos to take again (G76, mockup g76/3 state 3).
    expect(screen.getByText(toCyrillic('Old tomondan olingan rasm tiniq emas'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Bitta rasmni qayta oling'))).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Mashinangiz'))).toBeNull();
  });

  // G95: a link of a bot (a live trip, a booking) opens its own screen; the fix waits on the main screen.
  it('opens no fix by itself when a link of a bot opened the app', async () => {
    window.history.replaceState(null, '', '/?open=trip');
    toFix();
    expect(await screen.findByText(toCyrillic('Tuzatish kerak'))).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Mashinangiz'))).toBeNull();
    window.history.replaceState(null, '', '/');
  });

  it('F3: leaving with a changed car asks first and stays on «no»', async () => {
    toFix();
    asked.mockReturnValue(false);
    fireEvent.change(await screen.findByDisplayValue('01 A 123 BC'), { target: { value: '01A124BC' } });
    await tap(toCyrillic('Orqaga'));
    expect(asked).toHaveBeenCalledWith(toCyrillic('Oʻzgarishlar saqlanmaydi. Chiqasizmi?'));
    expect(screen.getByText(toCyrillic('Mashinangiz'))).toBeTruthy();
  });
});
