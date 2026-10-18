import type { AdminReview } from '@platform/contracts';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderManagement } from '../manage/manage-test-kit';
import { tap } from '../market/market-test-kit';

afterEach(cleanup);

const person = (n: number, firstName: string) => ({ id: String(n).repeat(32), firstName });
const review = (id: string, stars: number, text: string, hidden = false): AdminReview => ({
  id,
  author: person(1, 'Dilnoza'),
  about: person(2, 'Jasur'),
  stars,
  tags: text ? [] : ['on_time'],
  text,
  hidden,
  at: Date.parse('2026-10-17T10:00:00Z'),
});

// «Sharhlar» of the team (G45, docs/24, docs/79 T29): every review with who wrote it about whom; a
// tap opens it, «Yashirish» takes it out, a hidden one opens nothing.
describe('«Sharhlar»', () => {
  it('lists the reviews and hides one', async () => {
    const hideReview = vi.fn(async () => undefined);
    const teamReviews = vi.fn(async () => ({
      reviews: [review('r1', 1, 'Qoʻpol gapirdi'), review('r2', 5, ''), review('r3', 2, 'Telefon', true)],
      more: false,
    }));
    renderManagement({ feedback: { teamReviews, hideReview } });
    await tap('Sharhlar');
    expect(await screen.findAllByText('⭐ 1 · Dilnoza → Jasur')).toHaveLength(1);
    expect(screen.getByText(/Vaqtida$/u)).toBeTruthy();
    expect(screen.getByText(/Yashirilgan$/u)).toBeTruthy();
    await tap('⭐ 1 · Dilnoza → Jasur');
    expect(screen.getByText('Sharh profildan va reytingdan olinadi')).toBeTruthy();
    await tap('Yashirish');
    await waitFor(() => expect(hideReview).toHaveBeenCalledWith('r1'));
    expect(await screen.findAllByText(/Yashirilgan$/u)).toHaveLength(2);
  });
});
