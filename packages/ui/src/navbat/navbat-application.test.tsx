import { toCyrillic } from '@platform/i18n';
import { ApiError } from '@platform/api-client';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { closeSheet, sheetClosed } from '../home/sheet-closed';
import { BOBUR, detailOf, JASUR, renderNavbat } from './navbat-test-kit';

afterEach(cleanup);
URL.createObjectURL = vi.fn(() => 'blob:photo');
URL.revokeObjectURL = vi.fn();
const open = { filter: 'application' as const, kind: 'application' as const, id: JASUR.id };

// The decisions on an application inside «Navbat» (docs/04, docs/50, docs/94 B9, G43).
describe('an application in «Navbat»', () => {
  it('approves after the plate is compared with the front photo', async () => {
    const { decide } = renderNavbat(open, [JASUR, BOBUR]);
    fireEvent.click(await screen.findByText(toCyrillic('Tasdiqlash')));
    expect(await screen.findByText(toCyrillic('Raqamni tekshiring'))).toBeTruthy();
    expect(screen.getByRole('img', { name: '01 A 123 BC' })).toBeTruthy();
    fireEvent.click(screen.getByText(toCyrillic('Raqam mos, tasdiqlash')));
    expect(await screen.findByText(toCyrillic('Javob yuborildi'))).toBeTruthy();
    expect(decide).toHaveBeenCalledWith(JASUR.id, { action: 'approve' });
  });

  // G89 M5: a second tap while the first decision goes sends nothing.
  it('sends one decision for two quick taps', async () => {
    const { decide } = renderNavbat(open, [JASUR, BOBUR]);
    decide.mockImplementationOnce(() => new Promise((done) => setTimeout(done, 50)));
    fireEvent.click(await screen.findByText(toCyrillic('Tasdiqlash')));
    const yes = await screen.findByText(toCyrillic('Raqam mos, tasdiqlash'));
    fireEvent.click(yes);
    fireEvent.click(yes);
    expect(await screen.findByText(toCyrillic('Javob yuborildi'))).toBeTruthy();
    expect(decide).toHaveBeenCalledTimes(1);
  });

  it('keeps the plate fixed by the photo through Back and a failed decision', async () => {
    const { decide } = renderNavbat(open, [JASUR]);
    decide.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(await screen.findByText(toCyrillic('Tasdiqlash')));
    fireEvent.click(await screen.findByText(toCyrillic('Raqamni tuzatish')));
    fireEvent.change(screen.getByLabelText(toCyrillic('Davlat raqami')), {
      target: { value: '01 a 124 bc' },
    });
    fireEvent.click(screen.getByText(toCyrillic('Davom etish')));
    await screen.findByText(toCyrillic('Raqam rasm boʻyicha tuzatildi'));
    fireEvent.click(screen.getByText(toCyrillic('Orqaga')));
    fireEvent.click(await screen.findByText(toCyrillic('Tasdiqlash')));
    await act(async () => fireEvent.click(await screen.findByText(toCyrillic('Raqam mos, tasdiqlash'))));
    expect(await screen.findByText(`Jasur · ${toCyrillic('ariza')}`)).toBeTruthy();
    fireEvent.click(screen.getByText(toCyrillic('Tasdiqlash')));
    expect(await screen.findByRole('img', { name: '01 A 124 BC' })).toBeTruthy();
    fireEvent.click(screen.getByText(toCyrillic('Raqam mos, tasdiqlash')));
    await screen.findByText(toCyrillic('Javob yuborildi'));
    expect(decide).toHaveBeenLastCalledWith(JASUR.id, { action: 'approve', plate: '01A124BC' });
  });

  // The reasons in a sheet over the application (G78 К2); closing it asks nothing and keeps the
  // ticks (G79 К10): the next open has them ticked.
  it('asks for changes with ticked reasons; closing them asks nothing and keeps them', async () => {
    const { decide } = renderNavbat(open, [JASUR]);
    const asked = vi.spyOn(window, 'confirm');
    fireEvent.click(await screen.findByText(toCyrillic('Tuzatish')));
    expect(await screen.findByText(toCyrillic('Sabablarni tanlang'))).toBeTruthy();
    expect(screen.getByText(`Jasur · ${toCyrillic('ariza')}`)).toBeTruthy();
    fireEvent.click(screen.getByText(toCyrillic('Old tomondan olingan rasm tiniq emas')));
    await closeSheet();
    expect(asked).not.toHaveBeenCalled();
    asked.mockRestore();
    fireEvent.click(await screen.findByText(toCyrillic('Tuzatish')));
    fireEvent.click(screen.getByText(toCyrillic('Raqam rasmi aniq emas')));
    fireEvent.click(screen.getByText(toCyrillic('Yuborish')));
    await screen.findByText(toCyrillic('Javob yuborildi'));
    expect(decide).toHaveBeenCalledWith(JASUR.id, {
      action: 'request_changes',
      reasons: ['front_unclear', 'plate_not_readable'],
    });
    await sheetClosed();
  });

  // The days in a sheet over the application (G78 sheet 6).
  it('blocks for 7 days; a block for good is asked first', async () => {
    const block = vi.fn(async () => undefined);
    renderNavbat(open, [JASUR], { moderation: { block } });
    fireEvent.click(await screen.findByText(toCyrillic('Bloklash')));
    expect(await screen.findByText(toCyrillic('Qancha muddatga bloklaymiz?'))).toBeTruthy();
    vi.stubGlobal('confirm', () => false);
    await act(async () => fireEvent.click(screen.getByText(toCyrillic('Butunlay'))));
    vi.unstubAllGlobals();
    expect(block).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText(toCyrillic('7 kun')));
    expect(await screen.findByText(toCyrillic('Bloklandi'))).toBeTruthy();
    expect(block).toHaveBeenCalledWith(JASUR.id, 7);
    await sheetClosed();
  });

  it('stays on the application with the reason when the decision did not go through (G43)', async () => {
    const { decide } = renderNavbat(open, [JASUR]);
    decide.mockRejectedValueOnce(new ApiError(409, 'drivers.wrong_status'));
    fireEvent.click(await screen.findByText(toCyrillic('Tasdiqlash')));
    fireEvent.click(await screen.findByText(toCyrillic('Raqam mos, tasdiqlash')));
    expect(await screen.findByText(/Бу ариза аллақачон кўриб чиқилган/u)).toBeTruthy();
    expect(screen.getByText(`Jasur · ${toCyrillic('ariza')}`)).toBeTruthy();
  });

  it('opens a photo on the whole screen and shows earlier decisions and the car before', async () => {
    const was = { make: 'Chevrolet', model: 'Nexia', color: 'black' as const, plate: '30B456CA', seats: 4 };
    const get = async () => ({
      ...detailOf(JASUR),
      history: [{ status: 'rejected' as const, reasons: [], at: 1 }],
      was,
    });
    renderNavbat(open, [JASUR], { moderation: { get } });
    expect(await screen.findByText(toCyrillic('Rad etilgan'))).toBeTruthy();
    expect(screen.getByText(`Nexia · ${toCyrillic('Qora')} · 30 B 456 CA`)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: toCyrillic('Old tomondan, raqami bilan') }));
    expect(await screen.findByRole('img', { name: toCyrillic('Old tomondan, raqami bilan') })).toBeTruthy();
    fireEvent.click(screen.getByText(toCyrillic('Orqaga')));
    expect(await screen.findByText(`Jasur · ${toCyrillic('ariza')}`)).toBeTruthy();
  });

  // Decision 2 of the owner (20.10.2026, G91 DRV-2): the new car of a driver approved once gets
  // «Tuzatish» or a block, never «Rad etish».
  it('has no «Rad etish» for the new car of an approved driver', async () => {
    const get = async () => ({
      ...detailOf(JASUR),
      history: [{ status: 'approved' as const, reasons: [], at: 1 }],
    });
    renderNavbat(open, [JASUR], { moderation: { get } });
    expect(await screen.findByText(toCyrillic('Tuzatish'))).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Rad etish'))).toBeNull();
  });
});
