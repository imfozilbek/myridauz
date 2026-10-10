import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../market/market-test-kit';
import { gone, openPast, rode } from './past-trip-kit';

vi.mock('../chat/chat-screen', () => ({
  ChatScreen: ({ title, ring }: { readonly title: string; readonly ring?: boolean }) => (
    <p>{`chat ${title}${ring ? ' ring' : ''}`}</p>
  ),
}));
vi.mock('../feedback/complaint-screen', () => ({
  ComplaintScreen: ({ bookingId }: { readonly bookingId: string }) => <p>{`complaint ${bookingId}`}</p>,
}));

afterEach(cleanup);

const sheet = () => document.querySelector('.form-sheet .rider-pick') as HTMLElement;

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
  });

  // A sheet over the past trip, as the forms of the mockup g75/3 A: every passenger, one tap each.
  it('«Shikoyat» asks which passenger in a sheet over the trip', async () => {
    openPast([rode, gone]);
    await tap('Shikoyat');
    expect((await screen.findAllByText('Qaysi yoʻlovchi?')).length).toBeGreaterThan(0);
    fireEvent.click(within(sheet()).getByText('Akmal'));
    expect(await screen.findByText(`complaint ${gone.id}`)).toBeTruthy();
  });

  it('a fourth passenger is in the same sheet, never left out', async () => {
    const four = [named(1, 'Madina'), named(2, 'Akmal'), named(3, 'Sardor'), named(4, 'Bobur')];
    openPast(four);
    await tap('Shikoyat');
    await screen.findAllByText('Qaysi yoʻlovchi?');
    fireEvent.click(within(sheet()).getByText('Bobur'));
    expect(await screen.findByText('complaint r4')).toBeTruthy();
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
