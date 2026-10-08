import { MEET_BEFORE_MINUTES, MINUTE_MS, type Booking } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { RiderRow } from '../own-trip/rider-row';
import { renderInShell, testClients } from '../test-shell';
import { akmal, MEETING_NOW } from './meet-test-kit';
import { NoShowBanners } from './no-show-banners';
import { NoShowLine } from './no-show-line';

afterEach(cleanup);

const USUAL = 'Qoʻyliq pitagi';
const line = (booking: Booking, now = MEETING_NOW, onMark = vi.fn()) =>
  renderInShell(
    <NoShowLine booking={booking} now={now} onMark={onMark}>
      {USUAL}
    </NoShowLine>,
  );
const gone = { ...akmal, noShowAt: MEETING_NOW };
// The driver said «Men keldim» at the point of Akmal (docs/126).
const there = { ...akmal, driverCameAt: MEETING_NOW };

describe('«Kelmadi» in the row of the passenger (docs/129, mockup g63/5 phone 1)', () => {
  it('can be marked from «Men keldim» at the point until the trip closes', () => {
    const onMark = vi.fn();
    line(there, MEETING_NOW, onMark);
    fireEvent.click(screen.getByText('Kelmadi · safar tugaguncha belgilash mumkin'));
    expect(onMark).toHaveBeenCalledOnce();
  });

  it('marks from the row of «Mening safarim» without opening the booking', async () => {
    const onMark = vi.fn();
    const onOpen = vi.fn();
    renderMarket(
      <PlacesGate>
        <RiderRow
          booking={there}
          onChat={vi.fn()}
          onCall={vi.fn()}
          onOpen={onOpen}
          line={(usual) => (
            <NoShowLine booking={there} now={MEETING_NOW} onMark={onMark}>
              {usual}
            </NoShowLine>
          )}
        />
      </PlacesGate>,
      testClients({}),
    );
    const until = await screen.findByText('Kelmadi · safar tugaguncha belgilash mumkin');
    // The line is a button of its own beside the row, never a button inside a button.
    expect(until.closest('.rider-open')).toBeNull();
    expect(document.querySelector('button button')).toBeNull();
    fireEvent.click(until);
    fireEvent.keyDown(until, { key: 'Enter' });
    expect(onMark).toHaveBeenCalledOnce();
    expect(onOpen).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Akmal'));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('keeps the usual line before the meeting, before «Men keldim», for one who came and a request', () => {
    line(there, akmal.trip.departAt - (MEET_BEFORE_MINUTES + 1) * MINUTE_MS);
    // «Joʻnashga 30 daqiqa» and «Yoʻldasiz» keep where the people are taken (g63/4 screens 11, 14).
    line(akmal);
    line(akmal, akmal.trip.departAt + MINUTE_MS);
    line({ ...there, metAt: MEETING_NOW });
    line({ ...there, status: 'requested' });
    expect(screen.getAllByText(USUAL)).toHaveLength(5);
    expect(screen.queryByText(/^Kelmadi/u)).toBeNull();
  });

  it('keeps the line of the mark while the refund waits, the plate tells the rest (g63/5 phone 1)', () => {
    const onMark = vi.fn();
    line(gone, MEETING_NOW, onMark);
    line({ ...gone, refund: { state: 'proposed', amount: 9500 } });
    const kept = screen.getAllByText('Kelmadi · safar tugaguncha belgilash mumkin');
    expect(kept).toHaveLength(2);
    // Marked once: the line is no button any more.
    expect(kept.every((text) => text.closest('button') === null)).toBe(true);
    fireEvent.click(kept[0] as HTMLElement);
    expect(onMark).not.toHaveBeenCalled();
    expect(screen.queryByText(/kutilmoqda/u)).toBeNull();
  });

  it('says what the owner decided about the commission', () => {
    line({ ...gone, refund: { state: 'confirmed', amount: 9500 } });
    line({ ...gone, refund: { state: 'rejected', amount: 9500 } });
    expect(screen.getByText(/^Kelmadi · 9.500 qaytarildi$/u)).toBeTruthy();
    expect(screen.getByText('Kelmadi')).toBeTruthy();
  });
});

describe('the plate after «Kelmadi» (mockup g63/5 phone 1)', () => {
  it('tells the refund went to the team while it waits', () => {
    const confirmed = { ...gone, id: 'a2', refund: { state: 'confirmed' as const, amount: 9500 } };
    renderInShell(<NoShowBanners bookings={[gone, akmal, confirmed]} />);
    expect(screen.getAllByText('Akmal kelmadi')).toHaveLength(1);
    expect(screen.getByText(/^Komissiya 9.500: qaytarish soʻrovi jamoaga yuborildi$/u)).toBeTruthy();
  });
});
