import type { FeedbackClient } from '@platform/api-client';
import type { ReviewTarget } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { ComplaintScreen } from './complaint-screen';
import { FeedbackLink } from './feedback-link';

const sdk = vi.hoisted(() => ({ miniApp: { close: { ifAvailable: vi.fn() } } }));
vi.mock('@telegram-apps/sdk-react', async (original) => ({
  ...(await original<object>()),
  miniApp: sdk.miniApp,
}));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

const TARGET: ReviewTarget = { rateeId: '7', rateeName: 'Jasur', rateeRole: 'passenger', mine: null };
const RESTORED = 'Oldingi yozganingiz tiklandi.';
const open = (param: string, feedback: Partial<FeedbackClient>) => {
  window.history.replaceState(null, '', `/?${param}=b1`);
  return renderMarket(
    <FeedbackLink enabled>
      <p>Asosiy</p>
    </FeedbackLink>,
    testClients({ feedback: { target: async () => TARGET, ...feedback } }),
  );
};
const typeInto = (placeholder: RegExp, value: string) =>
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });

describe('a review and a complaint keep what was written (docs/94 F3, C1, C5)', () => {
  it('a review closed before sending comes back with its stars and text; sent, it is gone', async () => {
    const review = vi.fn<FeedbackClient['review']>(async () => undefined);
    const first = open('review', { review });
    await screen.findByText('Jasur bilan safar');
    expect(screen.queryByText(RESTORED)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    typeInto(/qisqacha/u, 'Yaxshi yoʻl');
    first.unmount();
    open('review', { review });
    expect(await screen.findByText(RESTORED)).toBeTruthy();
    expect(screen.getByDisplayValue('Yaxshi yoʻl')).toBeTruthy();
    expect(screen.getByRole('button', { name: '4' }).getAttribute('aria-pressed')).toBe('true');
    await tap('Yuborish');
    await waitFor(() => expect(review).toHaveBeenCalledWith(expect.objectContaining({ stars: 4 })));
    await screen.findByText(/Bahongiz saqlandi/u);
    cleanup();
    open('review', { review });
    await screen.findByText('Jasur bilan safar');
    expect(screen.queryByText(RESTORED)).toBeNull();
    expect(screen.queryByDisplayValue('Yaxshi yoʻl')).toBeNull();
  });

  it('a complaint comes back with its reason and comment until it is sent', async () => {
    const complain = vi.fn<FeedbackClient['complain']>(async () => undefined);
    const first = open('complain', { complain });
    await tap('Kelmadi');
    typeInto(/Nima boʻlganini/u, 'Bir soat kutdim');
    first.unmount();
    open('complain', { complain });
    expect(await screen.findByText(RESTORED)).toBeTruthy();
    await tap('Yuborish');
    await waitFor(() =>
      expect(complain).toHaveBeenCalledWith({
        bookingId: 'b1',
        reason: 'no_show',
        comment: 'Bir soat kutdim',
      }),
    );
    await screen.findByText(/Moderator koʻrib chiqadi/u);
    expect(localStorage.length).toBe(0);
  });

  it('keeps the button with a loader while sending, then «Yopish» goes back to the bot', async () => {
    let done: () => void = () => undefined;
    const review = vi.fn(
      () =>
        new Promise<undefined>((resolve) => {
          done = () => resolve(undefined);
        }),
    );
    open('review', { review });
    await screen.findByText('Jasur bilan safar');
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    await tap('Yuborish');
    const sending = screen.getByText('Yuborish').closest('button');
    expect(sending?.disabled).toBe(true);
    done();
    await tap('Yopish');
    expect(sdk.miniApp.close.ifAvailable).toHaveBeenCalledOnce();
    expect(screen.getByText('Asosiy')).toBeTruthy();
  });

  it('a complaint from a booking has no «Yopish»: the person stays in the app', async () => {
    const clients = testClients({ feedback: { complain: async () => undefined } });
    renderMarket(<ComplaintScreen bookingId="b1" onBack={() => undefined} />, clients);
    await tap('Boshqa');
    await tap('Yuborish');
    await screen.findByText(/Moderator koʻrib chiqadi/u);
    expect(screen.queryByText('Yopish')).toBeNull();
  });
});
