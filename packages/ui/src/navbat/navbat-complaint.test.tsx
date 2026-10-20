import { ApiError } from '@platform/api-client';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { COMPLAINT, COMPLAINT_DETAIL, renderNavbat } from './navbat-test-kit';

afterEach(cleanup);
const open = { filter: 'complaint' as const, kind: 'complaint' as const, id: COMPLAINT.id };
const lines = [
  { author: COMPLAINT_DETAIL.against.id, text: 'Tezroq chiq', at: 1 },
  { author: null, text: 'booking_confirmed', at: 2 },
];

// A complaint in «Navbat» (docs/17, docs/07, G43).
describe('a complaint in «Navbat»', () => {
  it('names every reason the person ticked, the gravest first (owner decision 10.10.2026)', async () => {
    const both = { ...COMPLAINT_DETAIL, reasons: ['harassment' as const, 'no_show' as const] };
    renderNavbat(open, [COMPLAINT], { feedback: { complaint: async () => both } });
    expect(await screen.findByText('Haqorat, tahdid yoki bezovta qilish, Kelmadi')).toBeTruthy();
  });

  // G45 (docs/17): both sides with their trips and complaints, the complaints before against the same
  // person with the decisions.
  it('shows the history of both sides and the complaints before', async () => {
    const past = [{ id: 'c0', reasons: ['no_show' as const], decision: 'warning' as const, at: 1 }];
    const known = { ...COMPLAINT_DETAIL, past, against: { ...COMPLAINT_DETAIL.against, complaints: 2 } };
    renderNavbat(open, [COMPLAINT], { feedback: { complaint: async () => known } });
    expect(await screen.findByText('Avvalgi shikoyatlar: Jasur')).toBeTruthy();
    expect(screen.getByText('Kelmadi · Ogohlantirildi')).toBeTruthy();
    expect(screen.getByText('3 safar · 0 shikoyat')).toBeTruthy();
    expect(screen.getByText('3 safar · 2 shikoyat')).toBeTruthy();
  });

  it('reads the chat only on demand, then comes back', async () => {
    const chat = vi.fn(async () => lines);
    renderNavbat(open, [COMPLAINT], { feedback: { complaint: async () => COMPLAINT_DETAIL, chat } });
    fireEvent.click(await screen.findByText('Suhbatni koʻrish'));
    expect(await screen.findByText('Tezroq chiq')).toBeTruthy();
    expect(chat).toHaveBeenCalledWith('c1');
    fireEvent.click(screen.getByText('Orqaga'));
    expect(await screen.findByText('Madina → Jasur (haydovchi)')).toBeTruthy();
  });

  // The driver's «Kelmadi» about the passenger: only then the commission goes back (G89 A1, A11).
  it('gives the commission back on a no-show with the warning', async () => {
    const decide = vi.fn(async () => undefined);
    const noShow = {
      ...COMPLAINT_DETAIL,
      author: COMPLAINT_DETAIL.against,
      against: COMPLAINT_DETAIL.author,
    };
    const { tracked } = renderNavbat(open, [COMPLAINT], {
      feedback: { complaint: async () => noShow, decide },
    });
    fireEvent.click(await screen.findByLabelText('Haydovchiga komissiyani qaytarish'));
    fireEvent.click(screen.getByText('Ogohlantirish'));
    await waitFor(() => expect(decide).toHaveBeenCalledWith('c1', { action: 'warning', refund: true }));
    expect(tracked.some((event) => event.name === 'complaint_decided')).toBe(true);
  });

  it('offers no refund when a passenger says the driver did not come', async () => {
    renderNavbat(open, [COMPLAINT], { feedback: { complaint: async () => COMPLAINT_DETAIL } });
    expect(await screen.findByText('Ogohlantirish')).toBeTruthy();
    expect(screen.queryByLabelText('Haydovchiga komissiyani qaytarish')).toBeNull();
  });

  it('keeps the complaint with the reason when the decision did not go through (G43)', async () => {
    const decide = vi.fn(async () => Promise.reject(new ApiError(409, 'complaints.wrong_status')));
    renderNavbat(open, [COMPLAINT], { feedback: { complaint: async () => COMPLAINT_DETAIL, decide } });
    fireEvent.click(await screen.findByText('Buzilish yoʻq'));
    expect(await screen.findByText(/Bu shikoyat allaqachon koʻrib chiqilgan/u)).toBeTruthy();
    expect(screen.getByText('Ogohlantirish')).toBeTruthy();
  });
});
