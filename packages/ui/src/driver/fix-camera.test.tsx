import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { application, car, renderGate, tap } from './driver-test-kit';

vi.mock('../account/profile/compress-image', () => ({ compressImage: async (file: Blob) => file }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const allPhotos = { front: true, side: true, interior: true };
const cameraOpened = (spy: { mock: { contexts: unknown[] } }) =>
  spy.mock.contexts.filter((input) => (input as HTMLInputElement).getAttribute('capture') === 'environment')
    .length;

// G79 В16 (docs/170): «Tuzatish» of the block with one photo to retake opens its camera at once
// (2 taps → 1); the fix that opens by itself at the start shows the reason first.
describe('one photo to retake', { timeout: 20_000 }, () => {
  it('opens the camera at once after «Tuzatish», not when the fix opens by itself', async () => {
    const clicked = vi.spyOn(HTMLInputElement.prototype, 'click');
    renderGate(
      application({ status: 'changes_requested', car, reasons: ['side_unclear'], photos: allPhotos }),
    );
    expect(await screen.findByText('Bitta rasmni almashtiring')).toBeTruthy();
    expect(cameraOpened(clicked)).toBe(0);
    await tap('Orqaga');
    await tap('Tuzatish');
    expect(await screen.findByText('Bitta rasmni almashtiring')).toBeTruthy();
    await waitFor(() => expect(cameraOpened(clicked)).toBe(1));
  });
});
