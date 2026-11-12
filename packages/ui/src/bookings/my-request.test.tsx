import { toCyrillic } from '@platform/i18n';
import { ApiError, type BookingsClient, type MarketClient } from '@platform/api-client';
import { REQUEST_LINK } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { booking, offer, request } from './booking-test-kit';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const salon = { ...request, wholeCar: true };
const confirmed = { ...booking, status: 'confirmed' as const, confirmedAt: Date.now(), plate: '01A123BC' };
const card = (name: string) => screen.getByText(name).closest('.offer-card') as HTMLElement;

function open(bookings: Partial<BookingsClient> = {}, market: Partial<MarketClient> = {}, link = false) {
  renderMarket(
    <MyRequestsScreen
      onBack={() => undefined}
      {...(link ? { link: { name: REQUEST_LINK, id: salon.id } } : {})}
    />,
    testClients({
      market: { myRequests: async () => [salon], ...market },
      bookings: { myBookings: async () => [], myOffers: async () => [offer], ...bookings },
    }),
  );
}

describe('«Mening soʻrovim» (G61, docs/118 path 4, mockup 3-offers A)', () => {
  it('the request on one line, then the offers with the driver, the car, the plate, the time and the price', async () => {
    open({}, {}, true);
    expect(await screen.findByText(/^Чилонзор → Фарғона шаҳри/u)).toBeTruthy();
    expect(screen.getByText(toCyrillic('2 kishi · bir joy 95 000 · Boʻsh salon kerak'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Takliflar (1)'))).toBeTruthy();
    const jasur = card('Jasur');
    expect(jasur.textContent).toContain(`Cobalt, ${toCyrillic('Oq')}`);
    expect(within(jasur).getByRole('img', { name: '01 A 123 BC' })).toBeTruthy();
    expect(jasur.textContent).toMatch(/95\s000/u);
    expect(screen.getByText(toCyrillic('Soʻrovni bekor qilish'))).toBeTruthy();
  });

  it('«Qabul qilish» in the card opens the page of the confirmed seat (G60)', async () => {
    const myBookings = vi.fn(async () => [confirmed]);
    const answerOffer = vi.fn<BookingsClient['answerOffer']>(async () => ({
      ...offer,
      status: 'accepted',
      bookingId: 'b1',
    }));
    open({ answerOffer, myBookings });
    await tap(/· Сўров$/u);
    fireEvent.click(await screen.findByRole('button', { name: toCyrillic('Qabul qilish') }));
    expect(await screen.findByText(toCyrillic('Joy tasdiqlandi'))).toBeTruthy();
    expect(answerOffer).toHaveBeenCalledWith('o1', 'accept');
  });

  it('«Rad etish» in the card answers no', async () => {
    const answerOffer = vi.fn<BookingsClient['answerOffer']>(async () => ({ ...offer, status: 'declined' }));
    open({ answerOffer });
    await tap(/· Сўров$/u);
    fireEvent.click(await screen.findByRole('button', { name: toCyrillic('Rad etish') }));
    await vi.waitFor(() => expect(answerOffer).toHaveBeenCalledWith('o1', 'decline'));
  });

  it('while waiting: the channel of the direction (docs/119), the cancel at the bottom', async () => {
    const cancelRequest = vi.fn<MarketClient['cancelRequest']>(async () => ({
      ...salon,
      status: 'cancelled',
    }));
    open({ myOffers: async () => [] }, { cancelRequest });
    await tap(/· Сўров$/u);
    expect(await screen.findByText(toCyrillic('Kutayotganda'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Kanalga qoʻshilish'))).toBeTruthy();
    // Asked first (docs/65 B4): «No» keeps the request with its offers, «Yes» cancels it (G77).
    const asked = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    await tap(toCyrillic('Soʻrovni bekor qilish'));
    await vi.waitFor(() => expect(asked).toHaveBeenCalledOnce());
    expect(asked).toHaveBeenCalledWith(
      toCyrillic('Soʻrovni bekor qilasizmi? Haydovchilar uni endi koʻrmaydi, kelgan takliflar yopiladi.'),
    );
    expect(cancelRequest).not.toHaveBeenCalled();
    await tap(toCyrillic('Soʻrovni bekor qilish'));
    await vi.waitFor(() => expect(cancelRequest).toHaveBeenCalledWith('r1'));
    asked.mockRestore();
  });

  it('lets the drivers call about the request; the passenger turns it off in one tap (G64, docs/127)', async () => {
    const setRequestCalls = vi.fn<MarketClient['setRequestCalls']>(async () => ({
      ...salon,
      callsOff: true,
    }));
    open({}, { setRequestCalls });
    await tap(/· Сўров$/u);
    const calls = (await screen.findByLabelText(
      toCyrillic('Haydovchilar qoʻngʻiroq qilishi mumkin'),
    )) as HTMLInputElement;
    expect(screen.getByText(toCyrillic('Oʻchirsangiz, haydovchilar faqat yozadi.'))).toBeTruthy();
    expect(calls.checked).toBe(true);
    fireEvent.click(calls);
    expect(setRequestCalls).toHaveBeenCalledWith('r1', false);
    expect(calls.checked).toBe(false);
  });

  it('puts the switch back and says why when the change fails', async () => {
    const setRequestCalls = vi.fn<MarketClient['setRequestCalls']>(async () => {
      throw new ApiError(409, 'trips.wrong_status');
    });
    open({}, { setRequestCalls });
    await tap(/· Сўров$/u);
    const calls = (await screen.findByLabelText(
      toCyrillic('Haydovchilar qoʻngʻiroq qilishi mumkin'),
    )) as HTMLInputElement;
    fireEvent.click(calls);
    await waitFor(() => expect(calls.checked).toBe(true));
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  // The offer opens over «Mening soʻrovim» in the sheet of the main screen (G78 sheet 2): the driver,
  // the car, the trip, the sum; «Qabul qilish» answers there.
  it('the card opens the offer in the sheet of the main screen and accepts it there', async () => {
    const answerOffer = vi.fn<BookingsClient['answerOffer']>(async () => ({ ...offer, status: 'declined' }));
    open({ answerOffer });
    await tap(/· Сўров$/u);
    await tap('Jasur');
    expect(await screen.findByText(toCyrillic('Yangi taklif'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Takliflar (1)'))).toBeTruthy();
    expect(screen.getByText(/^Бир жой 95.000$/u)).toBeTruthy();
    expect(screen.queryByText(/^Барча таклифлар/u)).toBeNull();
    fireEvent.click(
      screen.getAllByRole('button', { name: toCyrillic('Qabul qilish') }).at(-1) as HTMLElement,
    );
    await waitFor(() => expect(answerOffer).toHaveBeenCalledWith('o1', 'accept'));
    await waitFor(() => expect(screen.queryByText(toCyrillic('Yangi taklif'))).toBeNull());
  });

  it('keeps the sheet and says why when the answer fails', async () => {
    const answerOffer = vi.fn<BookingsClient['answerOffer']>(async () => {
      throw new ApiError(409, 'bookings.too_many');
    });
    open({ answerOffer });
    await tap(/· Сўров$/u);
    await tap('Jasur');
    fireEvent.click(
      (await screen.findAllByRole('button', { name: toCyrillic('Qabul qilish') })).at(-1) as HTMLElement,
    );
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText(toCyrillic('Yangi taklif'))).toBeTruthy();
  });
});
