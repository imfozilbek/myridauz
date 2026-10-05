import type { FeedbackClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../market/market-test-kit';
import { renderInShell, testClients } from '../test-shell';
import { PersonReviews } from './driver-reviews';

afterEach(cleanup);

const DRIVER = 'a'.repeat(32);
const REVIEW = { id: 'r1', authorName: 'Dilnoza', stars: 5, tags: [], text: 'Yaxshi', at: 1 };

describe('the reviews of a driver on a bad network (G43, docs/65 B3)', () => {
  it('a failed load offers one more try instead of hiding them', async () => {
    const reviewsOf = vi
      .fn<FeedbackClient['reviewsOf']>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ rating: { average: 5, count: 1 }, reviews: [REVIEW] });
    renderInShell(
      <PersonReviews userId={DRIVER} />,
      false,
      true,
      undefined,
      testClients({ feedback: { reviewsOf } }),
    );
    await tap('Qayta urinish');
    expect(await screen.findByText('Dilnoza')).toBeTruthy();
  });
});
