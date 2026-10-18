import type { UserReviews } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { ReviewsScreen } from './reviews-screen';

afterEach(cleanup);

const AT = Date.parse('2026-10-05T07:00:00Z');
const one = (n: number, text = '') => ({
  id: `r${n}`,
  authorName: `Yoʻlovchi ${n}`,
  stars: 5,
  tags: [],
  text,
  at: AT - n,
});

// «Barcha izohlar» (G46, docs/24): every review with its day, the newest first, older on demand.
describe('the reviews of a person', () => {
  it('shows the day of each review and brings the older ones', async () => {
    const first: UserReviews = {
      rating: { average: 5, count: 3 },
      reviews: [one(1, 'Zoʻr'), one(2)],
      more: true,
    };
    const reviewsOf = vi.fn(async () => ({ ...first, reviews: [one(3)], more: false }));
    renderMarket(
      <ReviewsScreen userId="d1" reviews={first} onBack={() => undefined} />,
      testClients({ feedback: { reviewsOf } }),
    );
    expect(await screen.findByText(/^5-oktabr · Zoʻr$/u)).toBeTruthy();
    await tap('Yana koʻrsatish');
    expect(await screen.findByText('Yoʻlovchi 3')).toBeTruthy();
    expect(reviewsOf).toHaveBeenCalledWith('d1', AT - 2);
    expect(screen.queryByText('Yana koʻrsatish')).toBeNull();
  });
});
