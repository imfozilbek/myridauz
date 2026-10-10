import { ApiError } from '@platform/api-client';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BOBUR, detailOf, JASUR, renderNavbat } from './navbat-test-kit';

afterEach(cleanup);
URL.createObjectURL = vi.fn(() => 'blob:photo');
URL.revokeObjectURL = vi.fn();
const open = { filter: 'application' as const, kind: 'application' as const, id: JASUR.id };

// The decisions on an application inside «Navbat» (docs/04, docs/50, docs/94 B9, G43).
describe('an application in «Navbat»', () => {
  it('approves after the plate is compared with the front photo', async () => {
    const { decide } = renderNavbat(open, [JASUR, BOBUR]);
    fireEvent.click(await screen.findByText('Tasdiqlash'));
    expect(await screen.findByText('Raqamni tekshiring')).toBeTruthy();
    expect(screen.getByRole('img', { name: '01 A 123 BC' })).toBeTruthy();
    fireEvent.click(screen.getByText('Raqam mos, tasdiqlash'));
    expect(await screen.findByText('Javob yuborildi')).toBeTruthy();
    expect(decide).toHaveBeenCalledWith(JASUR.id, { action: 'approve' });
  });

  it('keeps the plate fixed by the photo through Back and a failed decision', async () => {
    const { decide } = renderNavbat(open, [JASUR]);
    decide.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(await screen.findByText('Tasdiqlash'));
    fireEvent.click(await screen.findByText('Raqamni tuzatish'));
    fireEvent.change(screen.getByLabelText('Davlat raqami'), { target: { value: '01 a 124 bc' } });
    fireEvent.click(screen.getByText('Davom etish'));
    await screen.findByText('Raqam rasm boʻyicha tuzatildi');
    fireEvent.click(screen.getByText('Orqaga'));
    fireEvent.click(await screen.findByText('Tasdiqlash'));
    await act(async () => fireEvent.click(await screen.findByText('Raqam mos, tasdiqlash')));
    expect(await screen.findByText('Jasur · ariza')).toBeTruthy();
    fireEvent.click(screen.getByText('Tasdiqlash'));
    expect(await screen.findByRole('img', { name: '01 A 124 BC' })).toBeTruthy();
    fireEvent.click(screen.getByText('Raqam mos, tasdiqlash'));
    await screen.findByText('Javob yuborildi');
    expect(decide).toHaveBeenLastCalledWith(JASUR.id, { action: 'approve', plate: '01A124BC' });
  });

  it('asks for changes with ticked reasons; Back from them asks first', async () => {
    const { decide } = renderNavbat(open, [JASUR]);
    const asked = vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
    fireEvent.click(await screen.findByText('Tuzatish'));
    fireEvent.click(screen.getByText('Salon rasmi tiniq emas'));
    await act(async () => fireEvent.click(screen.getByText('Orqaga')));
    expect(asked).toHaveBeenCalledWith('Oʻzgarishlar saqlanmaydi. Chiqasizmi?');
    asked.mockRestore();
    fireEvent.click(screen.getByText('Raqam rasmi aniq emas'));
    fireEvent.click(screen.getByText('Yuborish'));
    await screen.findByText('Javob yuborildi');
    expect(decide).toHaveBeenCalledWith(JASUR.id, {
      action: 'request_changes',
      reasons: ['plate_not_readable', 'interior_unclear'],
    });
  });

  it('blocks for 7 days; a block for good is asked first', async () => {
    const block = vi.fn(async () => undefined);
    renderNavbat(open, [JASUR], { moderation: { block } });
    fireEvent.click(await screen.findByText('Bloklash'));
    vi.stubGlobal('confirm', () => false);
    fireEvent.click(screen.getByText('Butunlay'));
    vi.unstubAllGlobals();
    expect(block).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('7 kun'));
    expect(await screen.findByText('Bloklandi')).toBeTruthy();
    expect(block).toHaveBeenCalledWith(JASUR.id, 7);
  });

  it('stays on the application with the reason when the decision did not go through (G43)', async () => {
    const { decide } = renderNavbat(open, [JASUR]);
    decide.mockRejectedValueOnce(new ApiError(409, 'drivers.wrong_status'));
    fireEvent.click(await screen.findByText('Tasdiqlash'));
    fireEvent.click(await screen.findByText('Raqam mos, tasdiqlash'));
    expect(await screen.findByText(/Bu ariza allaqachon koʻrib chiqilgan/u)).toBeTruthy();
    expect(screen.getByText('Jasur · ariza')).toBeTruthy();
  });

  it('opens a photo on the whole screen and shows earlier decisions and the car before', async () => {
    const was = { make: 'Chevrolet', model: 'Nexia', color: 'black' as const, plate: '30B456CA', seats: 4 };
    const get = async () => ({
      ...detailOf(JASUR),
      history: [{ status: 'rejected' as const, reasons: [], at: 1 }],
      was,
    });
    renderNavbat(open, [JASUR], { moderation: { get } });
    expect(await screen.findByText('Rad etilgan')).toBeTruthy();
    expect(screen.getByText('Nexia · Qora · 30 B 456 CA')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Yon tomondan' }));
    expect(await screen.findByRole('img', { name: 'Yon tomondan' })).toBeTruthy();
    fireEvent.click(screen.getByText('Orqaga'));
    expect(await screen.findByText('Jasur · ariza')).toBeTruthy();
  });
});
