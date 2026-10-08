import type { BookingsClient } from '@platform/api-client';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { offer } from '../bookings/booking-test-kit';
import { FakeSocket } from '../chat/fake-socket';
import { NOW } from '../requests/board-test-kit';
import { openTalk, salonOffer, talk } from './talk-test-kit';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  vi.stubGlobal('WebSocket', FakeSocket);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// The call of a talk: the passenger rings the driver, or the other way (docs/08).
const ring = (socket: FakeSocket) =>
  act(() => socket.receive({ type: 'call', call: { status: 'active', caller: 'other' } }));

describe('the call before a booking (G64, mockups g64/2, g64/4)', { timeout: 20_000 }, () => {
  it('shows the driver the request and offers while they talk', async () => {
    const sendOffer = vi.fn<BookingsClient['sendOffer']>(async () => offer);
    const { socket } = await openTalk({ about: [talk('driver')], bookings: { sendOffer } });
    await screen.findByText('Yoʻlovchi');
    ring(socket);
    const call = within(screen.getByRole('dialog', { name: 'Qoʻngʻiroq' }));
    expect(call.getByText('Dilnozaning soʻrovi')).toBeTruthy();
    expect(call.queryByText('Ilovani yopmang: qoʻngʻiroq uziladi.')).toBeNull();
    expect(call.getByText('Chilonzor → Fargʻona · bugun')).toBeTruthy();
    expect(call.getByText('2 kishi · 95 000 · Uyidan yoki pitakdan')).toBeTruthy();
    const send = call.getByText('Taklif yuborish') as HTMLButtonElement;
    await waitFor(() => expect(send.disabled).toBe(false));
    fireEvent.click(send);
    // The time and the price of the offer come from the sheet, as on the board (G64 C).
    expect(await screen.findByText('Dilnozaga taklif')).toBeTruthy();
    expect(sendOffer).not.toHaveBeenCalled();
  });

  it('shows the passenger an offer that came during the call and takes it in one tap', async () => {
    const answerOffer = vi.fn<BookingsClient['answerOffer']>(async () => ({
      ...offer,
      status: 'accepted',
      bookingId: 'b1',
    }));
    const fresh = { ...salonOffer, createdAt: NOW + 60_000 };
    const { socket } = await openTalk({
      about: [talk('passenger', { offer: fresh })],
      bookings: { answerOffer },
    });
    await screen.findByText('Jasur taklif yubordi');
    ring(socket);
    const call = within(screen.getByRole('dialog', { name: 'Qoʻngʻiroq' }));
    expect(call.getByText('Jasurning taklifi · hozir keldi')).toBeTruthy();
    expect(call.getByText('bugun 08:00 · butun salon')).toBeTruthy();
    expect(call.getByText('4 joy × 90 000 = 360 000 · Qoʻyliq pitagi')).toBeTruthy();
    fireEvent.click(call.getByText('Taklifni qabul qilish'));
    await waitFor(() => expect(answerOffer).toHaveBeenCalledWith('o1', 'accept'));
  });

  it('shows the passenger only the own request while no offer came', async () => {
    const { socket } = await openTalk({ about: [talk('passenger')] });
    await screen.findByText('Jasur');
    ring(socket);
    const call = within(screen.getByRole('dialog', { name: 'Qoʻngʻiroq' }));
    expect(call.getByText('Soʻrovingiz: Chilonzor → Fargʻona, bugun')).toBeTruthy();
    expect(call.queryByText('Taklifni qabul qilish')).toBeNull();
  });

  it('says «hozir keldi» only of an offer that came during the call', async () => {
    const { socket } = await openTalk({ about: [talk('passenger', { offer: salonOffer })] });
    await screen.findByText('Jasur taklif yubordi');
    ring(socket);
    const call = within(screen.getByRole('dialog', { name: 'Qoʻngʻiroq' }));
    expect(call.getByText('Jasurning taklifi')).toBeTruthy();
    expect(call.queryByText(/hozir keldi/u)).toBeNull();
  });
});
