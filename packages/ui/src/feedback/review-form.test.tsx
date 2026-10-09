import type { ComfortClient, FeedbackClient } from '@platform/api-client';
import type { ReviewTarget } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { ReviewScreen } from './review-screen';

afterEach(cleanup);

const TARGET: ReviewTarget = {
  rateeId: '00000000000000000000000000000007',
  rateeName: 'Jasur',
  rateeRole: 'driver',
  mine: null,
};
const done = { ...confirmed, status: 'completed' as const };

function open(feedback: Partial<FeedbackClient>, comfort: Partial<ComfortClient> = {}) {
  const onBack = vi.fn();
  renderMarket(
    <ReviewScreen bookingId={done.id} onBack={onBack} onComplain={() => undefined} />,
    testClients({
      feedback: { target: async () => TARGET, ...feedback },
      chat: {
        about: async () => ({ booking: done, role: 'passenger', request: null, offer: null, driver: null }),
      },
      comfort: { favorites: async () => ({ drivers: [], trips: [] }), ...comfort },
    }),
  );
  return onBack;
}

describe('the review (G60, mockup g60/5): one short screen', () => {
  it('shows the driver and the one trip card, stars, tags as chips, the comment behind a link', async () => {
    open({});
    // After the trip the card shows the road between the ends (mockup g60/6).
    expect(await screen.findByText(/soat yoʻl$/u)).toBeTruthy();
    expect(screen.queryByText('2 joy')).toBeNull();
    expect(screen.getByText('Safar qanday oʻtdi?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Vaqtida' })).toBeTruthy();
    expect(screen.queryByPlaceholderText(/Safar haqida/u)).toBeNull();
    await tap('+ Izoh yozish');
    expect(screen.getByPlaceholderText(/Safar haqida/u)).toBeTruthy();
    expect(screen.getByText('Sevimli haydovchi')).toBeTruthy();
  });

  it('sends and goes back at once: no screen after sending', async () => {
    const review = vi.fn<FeedbackClient['review']>(async () => undefined);
    const onBack = open({ review });
    fireEvent.click(await screen.findByRole('button', { name: '5' }));
    await tap('Vaqtida');
    await tap('Yuborish');
    await vi.waitFor(() => expect(onBack).toHaveBeenCalled());
    expect(review).toHaveBeenCalledWith({ bookingId: done.id, stars: 5, tags: ['on_time'], text: '' });
    expect(screen.queryByText('Rahmat. Bahongiz saqlandi.')).toBeNull();
  });

  it('saves the driver as a favourite by the switch', async () => {
    const save = vi.fn<ComfortClient['save']>(async () => undefined);
    open({}, { save });
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Sevimli haydovchi' }));
    await vi.waitFor(() => expect(save).toHaveBeenCalledWith(TARGET.rateeId));
  });
});
