import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../market/market-test-kit';
import { gone, openPast, rode } from './past-trip-kit';

const choose = vi.hoisted(() => vi.fn());
vi.mock('../telegram/feedback', async (original) => ({
  ...(await original<typeof import('../telegram/feedback')>()),
  choose,
}));
vi.mock('../chat/chat-screen', () => ({
  ChatScreen: ({ title, ring }: { readonly title: string; readonly ring?: boolean }) => (
    <p>{`chat ${title}${ring ? ' ring' : ''}`}</p>
  ),
}));
vi.mock('../feedback/complaint-screen', () => ({
  ComplaintScreen: ({ bookingId }: { readonly bookingId: string }) => <p>{`complaint ${bookingId}`}</p>,
}));

afterEach(cleanup);

const named = (n: number, firstName: string) => ({
  ...rode,
  id: `r${n}`,
  passenger: { ...rode.passenger, id: `0000000000000000000000000000000${n}`, firstName },
});

describe('«Safardan keyin» of the driver: who a row is about (docs/129, mockup g63/5 phone 5)', () => {
  it('«Suhbatlar» opens the chat of the only passenger', async () => {
    openPast([rode]);
    await tap('Suhbatlar');
    expect(await screen.findByText('chat Madina')).toBeTruthy();
    expect(choose).not.toHaveBeenCalled();
  });

  it('«Shikoyat» asks which passenger in the window of Telegram', async () => {
    choose.mockResolvedValueOnce(gone.id);
    openPast([rode, gone]);
    await tap('Shikoyat');
    expect(await screen.findByText(`complaint ${gone.id}`)).toBeTruthy();
    expect(choose).toHaveBeenCalledWith('Qaysi yoʻlovchi?', [
      { id: rode.id, text: 'Madina' },
      { id: gone.id, text: 'Akmal' },
    ]);
  });

  it('a fourth passenger is chosen on the list, never left out', async () => {
    choose.mockClear();
    const four = [named(1, 'Madina'), named(2, 'Akmal'), named(3, 'Sardor'), named(4, 'Bobur')];
    openPast(four);
    await tap('Shikoyat');
    expect(await screen.findByText('Qaysi yoʻlovchi?')).toBeTruthy();
    await tap('Bobur');
    expect(await screen.findByText('complaint r4')).toBeTruthy();
    expect(choose).not.toHaveBeenCalled();
  });

  it('the chat and the call of a passenger row: the call rings', async () => {
    openPast([rode]);
    (await screen.findByRole('button', { name: 'Qoʻngʻiroq' })).click();
    expect(await screen.findByText('chat Madina ring')).toBeTruthy();
    cleanup();
    openPast([rode]);
    (await screen.findByRole('button', { name: 'Xabar yozish' })).click();
    expect(await screen.findByText('chat Madina')).toBeTruthy();
  });
});
