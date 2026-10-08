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
vi.mock('../chat/chat-screen', () => ({
  ChatScreen: ({ title, ring }: { readonly title: string; readonly ring?: boolean }) => (
    <p>{`chat ${title}${ring ? ' ring' : ''}`}</p>
  ),
}));

afterEach(cleanup);

const { talkUntil, complainUntil } = afterTrip(trip.departAt, trip.km);

describe('the past trip of the driver (docs/129, mockup g63/5 phone 5)', () => {
  it('shows when it ended, the passengers with their stars or the refund, the deadlines', async () => {
    openPast([rode, gone]);
    expect(await screen.findByText('Safar tugadi')).toBeTruthy();
    expect(screen.getByText('Yoʻlovchilar (3)')).toBeTruthy();
    expect(await screen.findByText('Baho: ★★★★★ qoʻydingiz')).toBeTruthy();
    expect(screen.getByText(/^Kelmadi · qaytarish 9.500 kutilmoqda$/u)).toBeTruthy();
    expect(screen.getByText(/^Hamma joy band · 95.000$/u)).toBeTruthy();
    expect(screen.getByText('Safardan keyin')).toBeTruthy();
    // Madina is rated: the stars are given, the complaint still has its six days.
    expect(screen.getByText('Hammasi baholandi')).toBeTruthy();
    expect(screen.getByText('6 kun qoldi')).toBeTruthy();
    expect(screen.getByText(/^Yozish mumkin: ertaga /u)).toBeTruthy();
    expect(screen.getByText(/^28.500 yechildi · 9.500 qaytishi mumkin$/u)).toBeTruthy();
  });

  it('says when it ended by «Yetib keldik» of the driver', async () => {
    const arrivedAt = Date.parse('2026-10-02T08:55:00+05:00');
    const early = { ...trip, arrivedAt };
    openPast([{ ...rode, trip: early }], { of: early });
    expect(await screen.findByText(/, 08:55 · /u)).toBeTruthy();
  });

  it('keeps the chat to read after its time and hides the call', async () => {
    openPast([rode], { now: talkUntil + HOUR_MS });
    expect(await screen.findByText('Xabarlar')).toBeTruthy();
    expect(screen.getByText('faqat oʻqish')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Qoʻngʻiroq' })).toBeNull();
    screen.getByRole('button', { name: 'Xabar yozish' }).click();
    expect(await screen.findByText('chat Madina')).toBeTruthy();
  });

  it('opens no stars after their deadline, and sends a late complaint to support', async () => {
    openPast([{ ...rode, rated: false }], { now: complainUntil + HOUR_MS });
    expect(await screen.findAllByText('muddat tugadi')).toHaveLength(2);
    // «Yoʻlovchilarni baholash» is a plain line now: nothing opens.
    expect(screen.queryByRole('button', { name: /Yoʻlovchilarni baholash/u })).toBeNull();
    await tap('Shikoyat: Yordam orqali');
    expect(support).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/t\.me\//u));
    expect(screen.getByText(/^19.000 yechildi$/u)).toBeTruthy();
  });

  it('opens the stars not given yet, then shows them on the page', async () => {
    const onPublish = openPast([{ ...rode, rated: false }]);
    expect(await screen.findByText('Grand yaqinida')).toBeTruthy();
    await tap('Qaytishni eʼlon qilish');
    expect(onPublish.mock.calls[0]?.[0].route.from.id).toBe(trip.to);
    await tap('Yoʻlovchilarni baholash');
    expect(await screen.findByText('Yoʻlovchilarni baholang')).toBeTruthy();
    await tap('Yuborish');
    expect(await screen.findByText('Qaytishga yoʻlovchi olasizmi?')).toBeTruthy();
    // «Назад» of «Qaytish» comes back to the past trip with the stars just given.
    await tap('Orqaga');
    expect(await screen.findByText('Baho: ★★★★★ qoʻydingiz')).toBeTruthy();
  });

  it('opens the wallet for the commission', async () => {
    openPast([rode]);
    await tap('Komissiya');
    expect(await screen.findByText('Bonus berildi')).toBeTruthy();
  });

  it('still takes «Kelmadi» after «Yetib keldik» until the trip closes (docs/129)', async () => {
    const arrivedAt = arrivalAt(trip.departAt, trip.km);
    const arrived = { ...trip, status: 'active' as const, departedAt: trip.departAt, arrivedAt };
    const waiting = { ...akmal, trip: arrived, driverCameAt: trip.departAt - 5 * MINUTE_MS };
    const meet = vi.fn(async () => ({ ...waiting, noShowAt: arrivedAt }));
    openPast([waiting], { of: arrived, now: arrivedAt + 30 * MINUTE_MS, meet });
    (await screen.findByText('Kelmadi · safar tugaguncha belgilash mumkin')).click();
    await vi.waitFor(() => expect(meet).toHaveBeenCalledWith(waiting.id, 'no_show'));
  });
});
