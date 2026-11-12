import { toCyrillic } from '@platform/i18n';
import { ApiError, type BookingsClient } from '@platform/api-client';
import type { Booking } from '@platform/contracts';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { testClients } from '../test-shell';
import { DriverMeeting } from './driver-meeting';
import { akmal, madina, MEETING_NOW } from './meet-test-kit';

afterEach(cleanup);
beforeEach(() => vi.setSystemTime(MEETING_NOW));
const asked = vi.spyOn(window, 'confirm');

// The page keeps the answers of the server, as «Mening safarim» does.
function Page({ start, onChat }: { readonly start: readonly Booking[]; readonly onChat: () => void }) {
  const [bookings, setBookings] = useState(start);
  const changed = (next: Booking) => setBookings(bookings.map((b) => (b.id === next.id ? next : b)));
  return (
    <DriverMeeting
      bookings={bookings}
      only={start.map(({ id }) => id)}
      onBack={() => undefined}
      onChanged={changed}
      onChat={onChat}
      onCall={onChat}
    />
  );
}

const open = (start: readonly Booking[], meet: BookingsClient['meet'], onChat = vi.fn()) =>
  renderMarket(
    <PlacesGate>
      <Page start={start} onChat={onChat} />
    </PlacesGate>,
    testClients({ bookings: { meet } }),
  );

const marked = (booking: Booking, patch: Partial<Booking>) => async () => ({ ...booking, ...patch });

// «Mening safarim» brings the fresh list a moment after the mark: until then the page is as it was.
const away = { onBack: vi.fn(), onChanged: vi.fn(), onChat: vi.fn(), onCall: vi.fn() };
const openStale = (start: readonly Booking[], meet: BookingsClient['meet']) =>
  renderMarket(
    <PlacesGate>
      <DriverMeeting bookings={start} only={start.map(({ id }) => id)} {...away} />
    </PlacesGate>,
    testClients({ bookings: { meet } }),
  );
const twice = async (text: string) => {
  const button = await screen.findByText(text);
  fireEvent.click(button);
  fireEvent.click(button);
  return button;
};

describe('«Uchrashuv» of the driver (docs/126, mockup g63/4 screen 13)', () => {
  it('shows each point: the passenger who came, the place by the rule of docs/121, who waits', async () => {
    open([{ ...madina, cameAt: MEETING_NOW }, akmal], vi.fn());
    expect(await screen.findByText(`Madina ${toCyrillic('keldi: uchrashuv joyida')}`)).toBeTruthy();
    expect(screen.getByText(/^1-нуқта · /u)).toBeTruthy();
    expect(screen.getByText(/^2-нуқта · /u)).toBeTruthy();
    expect(screen.getByText(toCyrillic('Grand yaqinida'))).toBeTruthy();
    expect(screen.getAllByText(toCyrillic('Chilonzor, Toshkent shahri'))).toHaveLength(2);
    expect(screen.getByText(`Madina · ${toCyrillic('2 joy')}`)).toBeTruthy();
    expect(screen.getAllByText(toCyrillic('Xaritada ochish'))).toHaveLength(2);
    // The first point not answered yet is in the colour of the app.
    expect(document.querySelectorAll('.meet-card-now')).toHaveLength(1);
  });

  it('«Men keldim», then «Keldi»: each mark goes to the server', async () => {
    const meet = vi
      .fn<BookingsClient['meet']>()
      .mockImplementationOnce(marked(madina, { driverCameAt: MEETING_NOW }))
      .mockImplementationOnce(marked(madina, { driverCameAt: MEETING_NOW, metAt: MEETING_NOW }));
    const { tracked } = open([madina], meet);
    await tap(toCyrillic('Men keldim'));
    expect(meet).toHaveBeenLastCalledWith('m1', 'came');
    // The refusal on the left, the main action on the right (docs/121).
    await screen.findByText(toCyrillic('Keldi'));
    const pair = [...document.querySelectorAll('.meet-answer button')].map((button) => button.textContent);
    expect(pair).toEqual([toCyrillic('Kelmadi'), toCyrillic('Keldi')]);
    await tap(toCyrillic('Keldi'));
    expect(meet).toHaveBeenLastCalledWith('m1', 'met');
    expect(await screen.findByText(toCyrillic('Keldi'))).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Kelmadi'))).toBeNull();
    // «Keldi» is the passenger in the car: the step «boarded» of the funnel (G76, docs/29).
    expect(tracked.filter((event) => event.name === 'boarded')).toHaveLength(1);
  });

  it('«Kelmadi» is asked first, then sends the refund to the team', async () => {
    const came = { ...akmal, driverCameAt: MEETING_NOW };
    const meet = vi.fn<BookingsClient['meet']>(marked(came, { noShowAt: MEETING_NOW }));
    open([came], meet);
    asked.mockReturnValueOnce(false);
    await tap(toCyrillic('Kelmadi'));
    expect(meet).not.toHaveBeenCalled();
    asked.mockReturnValueOnce(true);
    await tap(toCyrillic('Kelmadi'));
    expect(meet).toHaveBeenCalledWith('a1', 'no_show');
    expect(await screen.findByText(/^Келмади · қайтариш 9.500 кутилмоқда$/u)).toBeTruthy();
  });

  it('says why a mark did not go and keeps the button', async () => {
    const meet = vi.fn<BookingsClient['meet']>(async () => {
      throw new ApiError(409, 'bookings.not_meeting_time');
    });
    open([madina], meet);
    await tap(toCyrillic('Men keldim'));
    expect(await screen.findByText(/^Ҳозир учрашув вақти эмас/u)).toBeTruthy();
    expect(screen.getByText(toCyrillic('Men keldim'))).toBeTruthy();
  });

  it('opens the chat and the call of the passenger', async () => {
    const onChat = vi.fn();
    open([madina], vi.fn(), onChat);
    await tap(toCyrillic('Yozish'));
    await tap(toCyrillic('Qoʻngʻiroq'));
    expect(onChat).toHaveBeenCalledTimes(2);
  });

  it('a double tap, or a tap before the fresh list, sends a mark once (docs/65 A4)', async () => {
    let release: () => void = () => undefined;
    const answer = { ...madina, driverCameAt: MEETING_NOW };
    const meet = vi.fn<BookingsClient['meet']>(
      () => new Promise((resolve) => (release = () => resolve(answer))),
    );
    openStale([madina], meet);
    const button = await twice(toCyrillic('Men keldim'));
    await act(async () => release());
    fireEvent.click(button);
    expect(meet).toHaveBeenCalledOnce();
  });

  it('«Kelmadi» tapped twice is asked once and sent once', async () => {
    const came = { ...akmal, driverCameAt: MEETING_NOW };
    const meet = vi.fn<BookingsClient['meet']>(marked(came, { noShowAt: MEETING_NOW }));
    asked.mockClear();
    asked.mockReturnValueOnce(true);
    openStale([came], meet);
    const button = await twice(toCyrillic('Kelmadi'));
    await vi.waitFor(() => expect(meet).toHaveBeenCalledWith('a1', 'no_show'));
    await act(async () => undefined);
    fireEvent.click(button);
    expect(asked).toHaveBeenCalledOnce();
    expect(meet).toHaveBeenCalledOnce();
  });
});
