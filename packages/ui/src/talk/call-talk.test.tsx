import { toCyrillic } from '@platform/i18n';
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
    await screen.findByText(toCyrillic('Yoʻlovchi'));
    ring(socket);
    const call = within(screen.getByRole('dialog', { name: toCyrillic('Qoʻngʻiroq') }));
    expect(call.getByText(`Dilnoza${toCyrillic('ning soʻrovi')}`)).toBeTruthy();
    expect(call.queryByText(toCyrillic('Ilovani yopmang: qoʻngʻiroq uziladi.'))).toBeNull();
    expect(call.getByText(toCyrillic('Chilonzor → Fargʻona · bugun'))).toBeTruthy();
    expect(call.getByText(toCyrillic('2 kishi · 95 000 · Uyidan yoki pitakdan'))).toBeTruthy();
    const send = call.getByText(toCyrillic('Taklif yuborish')) as HTMLButtonElement;
    await waitFor(() => expect(send.disabled).toBe(false));
    fireEvent.click(send);
    // The time and the price of the offer come from the sheet, as on the board (G64 C).
    expect(await screen.findByText(`Dilnoza${toCyrillic('ga taklif')}`)).toBeTruthy();
    expect(sendOffer).not.toHaveBeenCalled();
  });

  it('tells the driver the offer went, as the card of the board does', async () => {
    const { socket } = await openTalk({ about: [talk('driver', { offer })] });
    await screen.findByText(toCyrillic('Yoʻlovchi'));
    ring(socket);
    const call = within(screen.getByRole('dialog', { name: toCyrillic('Qoʻngʻiroq') }));
    const sent = (await call.findByText(toCyrillic('Taklif yuborildi'))) as HTMLButtonElement;
    expect(sent.disabled).toBe(true);
    expect(call.queryByText(toCyrillic('Taklif yuborish'))).toBeNull();
  });

  it('shows the passenger an offer that came during the call and takes it in one tap', async () => {
    const answerOffer = vi.fn<BookingsClient['answerOffer']>(async () => ({
      ...offer,
      status: 'accepted',
      bookingId: 'b1',
    }));
    const fresh = { ...salonOffer, createdAt: NOW + 60_000 };
    const { socket, tracked } = await openTalk({
      about: [talk('passenger', { offer: fresh })],
      bookings: { answerOffer },
    });
    await screen.findByText(`Jasur ${toCyrillic('taklif yubordi')}`);
    ring(socket);
    const call = within(screen.getByRole('dialog', { name: toCyrillic('Qoʻngʻiroq') }));
    expect(call.getByText(`Jasur${toCyrillic('ning taklifi · hozir keldi')}`)).toBeTruthy();
    expect(call.getByText(toCyrillic('bugun 08:00 · butun salon'))).toBeTruthy();
    expect(call.getByText(toCyrillic('4 joy × 90 000 = 360 000 · Qoʻyliq pitagi'))).toBeTruthy();
    fireEvent.click(call.getByText(toCyrillic('Taklifni qabul qilish')));
    await waitFor(() => expect(answerOffer).toHaveBeenCalledWith('o1', 'accept'));
    expect(tracked).toContainEqual(expect.objectContaining({ step: 'offer_accepted', screen: 'call' }));
  });

  it('shows the passenger only the own request while no offer came', async () => {
    const { socket } = await openTalk({ about: [talk('passenger')] });
    await screen.findByText('Jasur');
    ring(socket);
    const call = within(screen.getByRole('dialog', { name: toCyrillic('Qoʻngʻiroq') }));
    expect(call.getByText(toCyrillic('Soʻrovingiz: Chilonzor → Fargʻona, bugun'))).toBeTruthy();
    expect(call.queryByText(toCyrillic('Taklifni qabul qilish'))).toBeNull();
  });

  it('says «hozir keldi» only of an offer that came during the call', async () => {
    const { socket } = await openTalk({ about: [talk('passenger', { offer: salonOffer })] });
    await screen.findByText(`Jasur ${toCyrillic('taklif yubordi')}`);
    ring(socket);
    const call = within(screen.getByRole('dialog', { name: toCyrillic('Qoʻngʻiroq') }));
    expect(call.getByText(`Jasur${toCyrillic('ning taklifi')}`)).toBeTruthy();
    expect(call.queryByText(/ҳозир келди/u)).toBeNull();
  });
});
