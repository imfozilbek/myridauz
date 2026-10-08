import { MEET_BEFORE_MINUTES, type Booking } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { akmal, MEETING_NOW } from './meet-test-kit';
import { NoShowBanners } from './no-show-banners';
import { NoShowLine } from './no-show-line';

afterEach(cleanup);

const MINUTE = 60 * 1000;
const USUAL = 'Qoʻyliq pitagi';
const line = (booking: Booking, now = MEETING_NOW, onMark = vi.fn()) =>
  renderInShell(
    <NoShowLine booking={booking} now={now} onMark={onMark}>
      {USUAL}
    </NoShowLine>,
  );
const gone = { ...akmal, noShowAt: MEETING_NOW };

describe('«Kelmadi» in the row of the passenger (docs/129, mockup g63/5 phone 1)', () => {
  it('can be marked from the meeting until the trip closes', () => {
    const onMark = vi.fn();
    line(akmal, MEETING_NOW, onMark);
    fireEvent.click(screen.getByText('Kelmadi · safar tugaguncha belgilash mumkin'));
    expect(onMark).toHaveBeenCalledOnce();
  });

  it('keeps the usual line before the meeting, for a passenger who came, and for a request', () => {
    line(akmal, akmal.trip.departAt - (MEET_BEFORE_MINUTES + 1) * MINUTE);
    line({ ...akmal, metAt: MEETING_NOW });
    line({ ...akmal, status: 'requested' });
    expect(screen.getAllByText(USUAL)).toHaveLength(3);
    expect(screen.queryByText(/^Kelmadi/u)).toBeNull();
  });

  it('says what became of the commission after the mark', () => {
    line(gone);
    line({ ...gone, refund: { state: 'proposed', amount: 9500 } });
    line({ ...gone, refund: { state: 'confirmed', amount: 9500 } });
    line({ ...gone, refund: { state: 'rejected', amount: 9500 } });
    expect(screen.getAllByText(/^Kelmadi · qaytarish 9.500 kutilmoqda$/u)).toHaveLength(2);
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
