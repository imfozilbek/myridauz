import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { application, car, renderGate, shoot, tap } from './driver-test-kit';

vi.mock('../account/profile/compress-image', () => ({ compressImage: async (file: Blob) => file }));
afterEach(cleanup);

describe('DriverGate: what the team asked to fix (docs/04)', () => {
  it('marks every place to fix and clears a place once it is fixed', async () => {
    const { uploadPhoto, container } = renderGate(
      application({
        status: 'changes_requested',
        car,
        reasons: ['plate_not_readable', 'plate_mismatch'],
        photos: { front: true, side: true, interior: true },
      }),
    );
    expect(await screen.findByText('Rasmda davlat raqami oʻqilmaydi')).toBeTruthy();
    expect(screen.getByText('Davlat raqami rasmdagiga mos emas')).toBeTruthy();
    await tap('Tuzatish');
    // The review marks the plate and the photos, each with its reason.
    expect(screen.getAllByText('Tuzatish')).toHaveLength(2);
    await tap('Davlat raqami');
    expect(screen.getByDisplayValue('01 A 123 BC')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Davlat raqami rasmdagiga mos emas');
    fireEvent.change(screen.getByDisplayValue('01 A 123 BC'), { target: { value: '01 A 124 BC' } });
    await tap('Davom etish');
    expect(screen.getAllByText('Tuzatish')).toHaveLength(1);
    await tap('Mashina rasmlari');
    expect(screen.getByRole('alert').textContent).toBe('Rasmda davlat raqami oʻqilmaydi');
    expect(screen.queryByText('Davom etish')).toBeNull();
    shoot(container, 'Qayta olish');
    await tap('Davom etish');
    expect(uploadPhoto).toHaveBeenCalledWith('front', expect.anything());
    expect(screen.queryByText('Tuzatish')).toBeNull();
  });
});
