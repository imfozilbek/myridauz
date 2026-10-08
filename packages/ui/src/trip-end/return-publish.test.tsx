import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROUTE } from '../market/market-test-kit';
import { renderInShell } from '../test-shell';
import { ReturnPublish } from './return-publish';

// The publishing is a flow of its own: here only what «Qaytish» hands it.
vi.mock('../market/new-trip-flow', () => ({
  NewTripFlow: (props: object) => <p>{JSON.stringify(props)}</p>,
}));

afterEach(cleanup);

const back = {
  route: { from: ROUTE.to, to: ROUTE.from },
  pickupMode: 'door' as const,
  seats: 3,
  price: 95000,
  womanOnBoard: true,
  bookingRule: 'seats_or_car' as const,
  comment: '',
  date: '2026-10-08',
  time: '15:00',
};

describe('the publishing of the way back from «Qaytish» (mockup g63/4 screen 16)', () => {
  it('keeps the day, the time and «Mashinada ayol bor» of the way back', () => {
    renderInShell(<ReturnPublish draft={back} onBack={vi.fn()} />);
    const props = JSON.parse(screen.getByText(/route/u).textContent ?? '{}');
    expect(props.again).toMatchObject({ date: '2026-10-08', time: '15:00', womanOnBoard: true });
    expect(props.again).toMatchObject({ seats: 3, price: 95000, bookingRule: 'seats_or_car' });
    expect(props.route.from.id).toBe(ROUTE.to.id);
  });
});
