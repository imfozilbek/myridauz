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
  it('reads the chat only on demand, then comes back', async () => {
    const chat = vi.fn(async () => lines);
    renderNavbat(open, [COMPLAINT], { feedback: { complaint: async () => COMPLAINT_DETAIL, chat } });
    fireEvent.click(await screen.findByText('Suhbatni koʻrish'));
    expect(await screen.findByText('Tezroq chiq')).toBeTruthy();
    expect(chat).toHaveBeenCalledWith('c1');
    fireEvent.click(screen.getByText('Orqaga'));
    expect(await screen.findByText('Madina → Jasur (haydovchi)')).toBeTruthy();
  });

  it('gives the commission back on a no-show with the warning', async () => {
    const decide = vi.fn(async () => undefined);
    const { tracked } = renderNavbat(open, [COMPLAINT], {
      feedback: { complaint: async () => COMPLAINT_DETAIL, decide },
    });
    fireEvent.click(await screen.findByLabelText('Haydovchiga komissiyani qaytarish'));
    fireEvent.click(screen.getByText('Ogohlantirish'));
    await waitFor(() => expect(decide).toHaveBeenCalledWith('c1', { action: 'warning', refund: true }));
    expect(tracked.some((event) => event.name === 'complaint_decided')).toBe(true);
  });

  it('keeps the complaint with the reason when the decision did not go through (G43)', async () => {
    const decide = vi.fn(async () => Promise.reject(new ApiError(409, 'complaints.wrong_status')));
    renderNavbat(open, [COMPLAINT], { feedback: { complaint: async () => COMPLAINT_DETAIL, decide } });
    fireEvent.click(await screen.findByText('Buzilish yoʻq'));
    expect(await screen.findByText(/Bu shikoyat allaqachon koʻrib chiqilgan/u)).toBeTruthy();
    expect(screen.getByText('Ogohlantirish')).toBeTruthy();
  });
});
