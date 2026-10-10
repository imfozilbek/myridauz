import type { FeedbackClient } from '@platform/api-client';
import type { Complaint, TeamRole } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { COMPLAINT, COMPLAINT_DETAIL, renderNavbat } from '../navbat/navbat-test-kit';

afterEach(cleanup);

// «Kelmadi» of the driver: the moderator decided and proposed to give the commission back (docs/35).
const waiting: Complaint = {
  ...COMPLAINT_DETAIL,
  status: 'resolved',
  refund: { state: 'proposed', amount: 9000 },
};
const REFUND = { ...COMPLAINT, refund: true };

function open(
  role: TeamRole,
  answerRefund: FeedbackClient['answerRefund'] = async () => undefined,
  complaint = waiting,
) {
  return renderNavbat({ filter: 'all', kind: 'complaint', id: complaint.id }, [REFUND], {
    feedback: { complaint: async () => complaint, answerRefund },
    moderation: { me: async () => ({ id: null, firstName: 'Ali', hasAvatar: false, role }) },
  });
}

// The refund of a no-show in «Navbat» of the owner (docs/35, G63, G75).
describe('the refund of a no-show in the admin app', () => {
  it('the owner sees the sum and confirms the refund; no decision is asked again', async () => {
    const answerRefund = vi.fn<FeedbackClient['answerRefund']>(async () => undefined);
    const { tracked } = open('owner', answerRefund);
    expect(await screen.findByText(/9\s000/u)).toBeTruthy();
    expect(screen.queryByText('Ogohlantirish')).toBeNull();
    fireEvent.click(await screen.findByText('Qaytarishni tasdiqlash'));
    await waitFor(() => expect(answerRefund).toHaveBeenCalledWith('c1', 'confirm'));
    expect(await screen.findByText('Javob yuborildi')).toBeTruthy();
    expect(tracked.some((event) => event.name === 'complaint_decided')).toBe(true);
  });

  it('the owner may refuse the refund', async () => {
    const answerRefund = vi.fn<FeedbackClient['answerRefund']>(async () => undefined);
    open('owner', answerRefund);
    fireEvent.click(await screen.findByText('Qaytarmaslik'));
    await waitFor(() => expect(answerRefund).toHaveBeenCalledWith('c1', 'reject'));
  });

  it('a moderator sees that it waits for the owner, without the buttons', async () => {
    open('moderator');
    expect(await screen.findByText('Loyiha egasi tasdiqlashini kutmoqda.')).toBeTruthy();
    expect(screen.queryByText('Qaytarishni tasdiqlash')).toBeNull();
  });

  it('a refund answered already shows how, without the buttons', async () => {
    open('owner', undefined, { ...waiting, refund: { state: 'confirmed', amount: 9000 } });
    expect(await screen.findByText('Komissiya haydovchiga qaytarildi.')).toBeTruthy();
    expect(screen.queryByText('Qaytarmaslik')).toBeNull();
    cleanup();
    open('owner', undefined, { ...waiting, refund: { state: 'rejected', amount: 9000 } });
    expect(await screen.findByText('Loyiha egasi qaytarmaslikka qaror qildi.')).toBeTruthy();
  });
});
