import { toCyrillic } from '@platform/i18n';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { application, renderGate, tap } from './driver-test-kit';

vi.mock('../account/profile/compress-image', () => ({ compressImage: async (file: Blob) => file }));
afterEach(() => {
  cleanup();
  localStorage.clear();
});

const allPhotos = { front: true };
const pressed = (name: string) => screen.getByRole('button', { name }).getAttribute('aria-pressed');

describe('the application not sent yet: the tile of the main screen and the draft (G62, docs/94 F3)', () => {
  it('invites to become a driver in 2 steps', async () => {
    renderGate(null);
    expect(await screen.findByText(toCyrillic('Arizani toʻldirish'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Mashina, raqam va rasm · 3 daqiqa'))).toBeTruthy();
  });

  it('keeps the answers after the app is closed and clears them once the application is sent', async () => {
    renderGate(null);
    await tap(toCyrillic('Arizani toʻldirish'));
    await tap('Damas');
    fireEvent.click(screen.getByRole('button', { name: toCyrillic('Oq') }));
    // Telegram closes the Mini App on the plate.
    cleanup();
    renderGate(application({ photos: allPhotos }));
    await tap(toCyrillic('Arizani toʻldirish'));
    expect(await screen.findByText(toCyrillic('Oldingi yozganingiz tiklandi.'))).toBeTruthy();
    expect(pressed('Damas')).toBe('true');
    expect(pressed(toCyrillic('Oq'))).toBe('true');
    expect(screen.getByText('6')).toBeTruthy();
    fireEvent.change(screen.getByLabelText(toCyrillic('Davlat raqami')), { target: { value: '01A123BC' } });
    await tap(toCyrillic('Davom etish'));
    await tap(toCyrillic('Arizani yuborish'));
    expect(
      await screen.findByText(toCyrillic('Tekshiruvdan keyin ochiladi. Odatda 1 soat ichida.')),
    ).toBeTruthy();
    await waitFor(() => expect(localStorage.getItem('draft:application')).toBeNull());
  });
});
