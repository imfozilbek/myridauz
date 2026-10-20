import { ApiError } from '@platform/api-client';
import type { AppLink } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../market/market-test-kit';
import { NOW, openBoard } from './board-test-kit';

type Shown = {
  readonly link?: AppLink;
  readonly onLink?: (link: AppLink) => void;
  readonly onBack: () => void;
};

// The talk and «Mening safarlarim» are screens of their own: here only what the board hands them.
vi.mock('../chat/chat-screen', () => ({
  ChatScreen: ({ onLink }: Shown) => (
    <button type="button" onClick={() => onLink?.({ name: 'mytrip', id: 't9' })}>
      the trip opened in the talk
    </button>
  ),
}));
vi.mock('../market/my-trips-screen', () => ({
  MyTripsScreen: ({ link, onBack }: Shown) => (
    <button type="button" onClick={onBack}>{`mine ${link?.name ?? ''} ${link?.id ?? ''}`}</button>
  ),
}));

beforeEach(() => void vi.useFakeTimers({ toFake: ['Date'], now: NOW }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('the talk of the board (G77, C2)', { timeout: 20_000 }, () => {
  it('a trip for a whole car opened in the talk opens as from the board; «Назад» comes back to it', async () => {
    openBoard({ bookings: { openTalk: async () => 'talk-1' } });
    fireEvent.click(await screen.findByLabelText('Xabar yozish'));
    await tap('the trip opened in the talk');
    await tap('mine mytrip t9');
    expect(await screen.findByText('Dilnoza')).toBeTruthy();
  });

  // G89 U7: the request closed while the driver looked: the reason, and the board loads again.
  it('a talk on a request closed meanwhile says it changed and loads the board again', async () => {
    const openTalk = async () => Promise.reject(new ApiError(409, 'bookings.wrong_status'));
    const requestBoard = openBoard({ bookings: { openTalk } });
    fireEvent.click(await screen.findByLabelText('Xabar yozish'));
    expect(await screen.findByText('Bu soʻrov allaqachon oʻzgargan. Roʻyxatni yangilang.')).toBeTruthy();
    await waitFor(() => expect(requestBoard).toHaveBeenCalledTimes(2));
  });
});
