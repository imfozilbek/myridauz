import { ApiError } from '@platform/api-client';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { ReviewScreen } from '../feedback/review-screen';
import { PeopleScreen } from '../manage/people-screen';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';

afterEach(cleanup);

// G91 ERR-1: an answer that never changes (the rating time is over, the screen is the owner's) says
// its reason and leads back; «Qayta urinish» there would fail forever.
describe('a screen that cannot load for good', () => {
  it('an old link of the rating says the time is over and goes back', async () => {
    const onBack = vi.fn();
    renderMarket(
      <ReviewScreen bookingId={confirmed.id} onBack={onBack} onComplain={() => undefined} />,
      testClients({
        feedback: {
          target: async () => {
            throw new ApiError(409, 'reviews.too_late');
          },
        },
      }),
    );
    expect(await screen.findByText('Baholash muddati tugagan.')).toBeTruthy();
    expect(screen.queryByText('Qayta urinish')).toBeNull();
    // The main button leads back, as «Назад» of the header (both read «Orqaga» outside Telegram).
    const [, main] = screen.getAllByText('Orqaga');
    if (main) fireEvent.click(main);
    expect(onBack).toHaveBeenCalled();
  });

  it('a person only the owner may open says so', async () => {
    renderMarket(
      <PeopleScreen person="00000000000000000000000000000007" onBack={() => undefined} />,
      testClients({
        team: {
          person: async () => {
            throw new ApiError(403, 'auth.not_owner');
          },
        },
      }),
    );
    expect(await screen.findByText('Buni faqat loyiha egasi qila oladi.')).toBeTruthy();
    expect(screen.queryByText('Qayta urinish')).toBeNull();
  });

  it('a failed network still offers «Qayta urinish»', async () => {
    renderMarket(
      <ReviewScreen bookingId={confirmed.id} onBack={() => undefined} onComplain={() => undefined} />,
      testClients({
        feedback: {
          target: async () => {
            throw new ApiError(0, 'network.failed');
          },
        },
      }),
    );
    expect(await screen.findByText('Qayta urinish')).toBeTruthy();
  });

  // G91 texts 1, 3 (owner, 20.10.2026): a trip that is gone, a rating of a ride that was not hers.
  it('a rating that cannot be given says so', async () => {
    renderMarket(
      <ReviewScreen bookingId={confirmed.id} onBack={() => undefined} onComplain={() => undefined} />,
      testClients({
        feedback: {
          target: async () => {
            throw new ApiError(404, 'reviews.not_found');
          },
        },
      }),
    );
    expect(await screen.findByText('Bu safarni baholab boʻlmaydi.')).toBeTruthy();
    expect(screen.queryByText('Qayta urinish')).toBeNull();
  });
});
