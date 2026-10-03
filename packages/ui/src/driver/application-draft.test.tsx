import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { application, renderGate, tap } from './driver-test-kit';

vi.mock('../account/profile/compress-image', () => ({ compressImage: async (file: Blob) => file }));
afterEach(() => {
  cleanup();
  localStorage.clear();
});

const progress = async () => {
  await screen.findByText('Arizani toʻldiring');
  return Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'));
};
const allPhotos = { front: true, side: true, interior: true };

describe('the application not sent yet: the card of the main screen and the draft (G34, docs/94 F3)', () => {
  it('counts the parts done on the card: the car, the photos, the sending', async () => {
    renderGate(null, false);
    expect(await progress()).toBe(0);
    expect(screen.getByText('3 qadam: mashina, rasmlar, yuborish.')).toBeTruthy();
    cleanup();
    renderGate(application({ photos: allPhotos }));
    expect(await progress()).toBe(33);
  });

  it('keeps the answers after the app is closed and clears them once the application is sent', async () => {
    renderGate(null);
    await tap('Arizani toʻldiring');
    await tap('Chevrolet Damas');
    await tap('Oq');
    // Telegram closes the Mini App on the plate.
    cleanup();
    renderGate(application({ photos: allPhotos }));
    expect(await progress()).toBe(33);
    await tap('Arizani toʻldiring');
    expect(await screen.findByText('Oldingi yozganingiz tiklandi.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Davlat raqami'), { target: { value: '01A123BC' } });
    await tap('Davom etish');
    // «Назад» on the review of a new application goes to the step before it.
    await tap('Davom etish');
    expect(await screen.findByText('Arizani tekshiring')).toBeTruthy();
    await tap('Orqaga');
    expect(await screen.findByText('Rasmlar')).toBeTruthy();
    await tap('Davom etish');
    cleanup();
    renderGate(application({ photos: allPhotos }));
    expect(await progress()).toBe(67);
    await tap('Arizani toʻldiring');
    expect(await screen.findByText('Chevrolet Damas')).toBeTruthy();
    await tap('Yuborish');
    expect(await screen.findByText('Ariza yuborildi')).toBeTruthy();
    await waitFor(() => expect(localStorage.getItem('draft:application')).toBeNull());
  });
});
