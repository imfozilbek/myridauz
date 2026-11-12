import { toCyrillic } from '@platform/i18n';
import { loadBrand } from '@platform/brands';
import { afterTrip, arrivalAt, HOUR_MS, MINUTE_MS } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../market/market-test-kit';
import { akmal } from '../meeting/meet-test-kit';
import { gone, openPast, rode, trip } from './past-trip-kit';

const support = vi.hoisted(() => vi.fn());
vi.mock('../telegram/feedback', async (original) => ({
  ...(await original<typeof import('../telegram/feedback')>()),
  openInTelegram: support,
  confirm: async () => true,
}));
type Chat = { readonly title: string; readonly ring?: boolean; readonly onTrip?: () => void };
vi.mock('../chat/chat-screen', () => ({
  ChatScreen: ({ title, ring, onTrip }: Chat) => (
    <button type="button" onClick={onTrip}>{`chat ${title}${ring ? ' ring' : ''}`}</button>
  ),
}));

afterEach(cleanup);

const { talkUntil, complainUntil } = afterTrip(loadBrand(), trip);

describe('the past trip of the driver (docs/129, mockup g63/5 phone 5)', () => {
  it('shows when it ended, the passengers with their stars or the refund, the deadlines', async () => {
    openPast([rode, gone]);
    expect(await screen.findByText(toCyrillic('Safar tugadi'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Yoʻlovchilar (3)'))).toBeTruthy();
    expect(await screen.findByText(toCyrillic('Baho: ★★★★★ qoʻydingiz'))).toBeTruthy();
    expect(screen.getByText(/^Келмади · қайтариш 9.500 кутилмоқда$/u)).toBeTruthy();
    expect(screen.getByText(/^Ҳамма жой банд · 95.000$/u)).toBeTruthy();
    expect(screen.getByText(toCyrillic('Safardan keyin'))).toBeTruthy();
    // Madina, the only one who rode, is rated: the stars row only says so (G78 В17); the complaint
    // keeps its six days.
    expect(screen.getByText(toCyrillic('Hammasi baholandi'))).toBeTruthy();
    expect(screen.getAllByText(toCyrillic('6 kun qoldi'))).toHaveLength(1);
    expect(screen.getByText(/^Ёзиш мумкин: эртага /u)).toBeTruthy();
    // What stays taken, then what may come back (mockup: «18 000 yechildi · 9 000 qaytishi mumkin»).
    expect(screen.getByText(/^19.000 ечилди · 9.500 қайтиши мумкин$/u)).toBeTruthy();
  });

  it('says when it ended by «Yetib keldik» of the driver', async () => {
    const arrivedAt = Date.parse('2026-10-02T08:55:00+05:00');
    const early = { ...trip, arrivedAt };
    openPast([{ ...rode, trip: early }], { of: early });
    expect(await screen.findByText(/, 08:55 · /u)).toBeTruthy();
  });

  it('keeps the chat to read after its time and hides the call', async () => {
    openPast([rode], { now: talkUntil + HOUR_MS });
    expect(await screen.findByText(toCyrillic('Xabarlar'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('faqat oʻqish'))).toBeTruthy();
    expect(screen.queryByRole('button', { name: toCyrillic('Qoʻngʻiroq') })).toBeNull();
    screen.getByRole('button', { name: toCyrillic('Xabar yozish') }).click();
    // The line of the trip in the chat is this very trip: back to its page (G77).
    await tap('chat Madina');
    expect(await screen.findByText(toCyrillic('Xabarlar'))).toBeTruthy();
  });

  it('opens no stars after their deadline, and sends a late complaint to support', async () => {
    openPast([{ ...rode, rated: false }], { now: complainUntil + HOUR_MS });
    expect(await screen.findAllByText(toCyrillic('muddat tugadi'))).toHaveLength(2);
    // «Yoʻlovchilarni baholash» is a plain line now: nothing opens.
    expect(screen.queryByRole('button', { name: /Йўловчиларни баҳолаш/u })).toBeNull();
    await tap(toCyrillic('Shikoyat: Yordam orqali'));
    expect(support).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/t\.me\//u));
    expect(screen.getByText(/^19.000 ечилди$/u)).toBeTruthy();
  });

  it('opens the stars not given yet, then shows them on the page', async () => {
    const onPublish = openPast([{ ...rode, rated: false }]);
    expect(await screen.findByText(toCyrillic('Grand yaqinida'))).toBeTruthy();
    await tap(toCyrillic('Qaytishni eʼlon qilish'));
    expect(onPublish.mock.calls[0]?.[0].route.from.id).toBe(trip.to);
    await tap(toCyrillic('Yoʻlovchilarni baholash'));
    expect(await screen.findByText(toCyrillic('Yoʻlovchilarni baholang'))).toBeTruthy();
    // «Yuborish» comes back to the past trip with the stars just given (G78 В10 A).
    await tap(toCyrillic('Yuborish'));
    expect(await screen.findByText(toCyrillic('Baho: ★★★★★ qoʻydingiz'))).toBeTruthy();
  });

  it('opens the wallet for the commission', async () => {
    openPast([rode]);
    await tap(toCyrillic('Komissiya'));
    expect(await screen.findByText(toCyrillic('Boshlash bonusi'))).toBeTruthy();
  });

  it('still takes «Kelmadi» after «Yetib keldik» until the trip closes (docs/129)', async () => {
    const arrivedAt = arrivalAt(trip.departAt, trip.km);
    const arrived = { ...trip, status: 'active' as const, departedAt: trip.departAt, arrivedAt };
    const waiting = { ...akmal, trip: arrived, driverCameAt: trip.departAt - 5 * MINUTE_MS };
    const meet = vi.fn(async () => ({ ...waiting, noShowAt: arrivedAt }));
    openPast([waiting], { of: arrived, now: arrivedAt + 30 * MINUTE_MS, meet });
    (await screen.findByText(toCyrillic('Kelmadi · safar tugaguncha belgilash mumkin'))).click();
    await vi.waitFor(() => expect(meet).toHaveBeenCalledWith(waiting.id, 'no_show'));
  });
});
