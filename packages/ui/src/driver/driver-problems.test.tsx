import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { application, car, renderGate, shoot, tap } from './driver-test-kit';

vi.mock('../account/profile/compress-image', () => ({ compressImage: async (file: Blob) => file }));
afterEach(cleanup);

const allPhotos = { front: true, side: true, interior: true };
const send = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;

describe('DriverGate: what the team asked to fix (docs/04, G62 mockup 5)', () => {
  it('outlines the bad photo with its reason and sends again once it is retaken', async () => {
    const { submit, uploadPhoto, container } = renderGate(
      application({ status: 'changes_requested', car, reasons: ['side_unclear'], photos: allPhotos }),
    );
    expect(await screen.findByText('Bitta rasmni almashtiring')).toBeTruthy();
    const side = screen.getByText('Yon tomondan', { exact: true }).closest('button');
    expect(side?.className).toContain('photo-tile-problem');
    expect(side?.textContent).toContain('Yon tomondan olingan rasm tiniq emas');
    expect(send('Qayta yuborish').disabled).toBe(true);
    shoot(container, 'Yon tomondan');
    await waitFor(() => expect(send('Qayta yuborish').disabled).toBe(false));
    expect(uploadPhoto).toHaveBeenCalledWith('side', expect.anything());
    await tap('Qayta yuborish');
    await waitFor(() => expect(submit).toHaveBeenCalledWith(car));
  });

  it('opens a car to fix on the car with the reason, then sends without a photo to retake', async () => {
    const { submit } = renderGate(
      application({ status: 'changes_requested', car, reasons: ['plate_mismatch'], photos: allPhotos }),
    );
    expect(await screen.findByText('Mashinangiz')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Davlat raqami rasmdagiga mos emas');
    expect(screen.getByLabelText('Davlat raqami').closest('label')?.className).toContain('uz-plate-problem');
    fireEvent.change(screen.getByDisplayValue('01 A 123 BC'), { target: { value: '01A124BC' } });
    expect(screen.queryByRole('alert')).toBeNull();
    await tap('Davom etish');
    expect(await screen.findByText('Mashina rasmlari')).toBeTruthy();
    await tap('Qayta yuborish');
    await waitFor(() => expect(submit).toHaveBeenCalledWith({ ...car, plate: '01A124BC' }));
  });
});
