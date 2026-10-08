import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { application, renderGate, tap } from './driver-test-kit';

vi.mock('../account/profile/compress-image', () => ({ compressImage: async (file: Blob) => file }));
afterEach(() => {
  cleanup();
  localStorage.clear();
});

const allPhotos = { front: true, side: true, interior: true };
const pressed = (name: string) => screen.getByRole('button', { name }).getAttribute('aria-pressed');

describe('the application not sent yet: the tile of the main screen and the draft (G62, docs/94 F3)', () => {
  it('invites to become a driver in 2 steps', async () => {
    renderGate(null);
    expect(await screen.findByText('Haydovchi boʻlish')).toBeTruthy();
    expect(screen.getByText('2 qadam: mashina va uning rasmlari')).toBeTruthy();
  });

  it('keeps the answers after the app is closed and clears them once the application is sent', async () => {
    renderGate(null);
    await tap('Haydovchi boʻlish');
    await tap('Damas');
    fireEvent.click(screen.getByRole('button', { name: 'Oq' }));
    // Telegram closes the Mini App on the plate.
    cleanup();
    renderGate(application({ photos: allPhotos }));
    await tap('Haydovchi boʻlish');
    expect(await screen.findByText('Oldingi yozganingiz tiklandi.')).toBeTruthy();
    expect(pressed('Damas')).toBe('true');
    expect(pressed('Oq')).toBe('true');
    expect(screen.getByText('6')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Davlat raqami'), { target: { value: '01A123BC' } });
    await tap('Davom etish');
    await tap('Arizani yuborish');
    expect(await screen.findByText('Arizangiz tekshirilmoqda')).toBeTruthy();
    await waitFor(() => expect(localStorage.getItem('draft:application')).toBeNull());
  });
});
