import { HOUR_MS as HOUR } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { closeDeparted, rememberPost } from './application/channels';
import { BEFORE, setup } from './channels-kit';
import { PLACES, TRIP } from './channels-fixtures';
import { channelPost } from './infrastructure/post-text';
import { lifePost } from './infrastructure/post-life';

// 2.10.2026 08:30 … 10:30 in Tashkent: a range of two hours (G90, docs/216).
const RANGE = { ...TRIP, departUntil: TRIP.departAt + 2 * HOUR };
const lines = (text: string) => text.split('\n').map((line) => line.replace(/\s/gu, ' '));
const FIND = 'https://t.me/test_bot?startapp=find';

describe('a range in the channel posts (G90, docs/216)', () => {
  it('shows the window «08:30 … 10:30» and no arrival', () => {
    const { text } = channelPost('test_bot')(RANGE, PLACES, BEFORE, 'yol_samarqand');
    expect(lines(text)[1]).toBe('<b>Ertaga, 2-oktabr · 08:30 … 10:30</b>');
  });

  it('keeps the window in the life of the post, the arrival from its end', () => {
    const full = lifePost('full', { ...RANGE, seatsLeft: 0 }, PLACES, BEFORE, FIND);
    expect(lines(full.text)[1]).toBe('<b>Ertaga, 2-oktabr · 08:30 … 10:30</b>');
    const started = lifePost('started', { ...RANGE, departedAt: RANGE.departAt }, PLACES, BEFORE, FIND);
    expect(lines(started.text)[1]).toBe('<b>Ertaga, 2-oktabr · 08:30 … 10:30</b>');
    const arrived = lifePost('arrived', { ...RANGE, status: 'completed' }, PLACES, BEFORE, FIND);
    expect(lines(arrived.text)[1]).toBe('Chilonzor → Samarqand shahri · 2 kishi · 15:30 da');
  });

  it('keeps the posts open until the end of the range: the driver still takes people', async () => {
    const { deps, sent, later } = setup(RANGE);
    await rememberPost(deps, { tripId: 'trip-1', channel: '@ch_samarqand', messageId: 7 }, 'active 3 true');
    later(RANGE.departAt + HOUR);
    await closeDeparted(deps);
    expect(sent).toEqual([]);
    later(RANGE.departUntil);
    await closeDeparted(deps);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.text.startsWith('<b>🚗 Yoʻlga chiqdi</b>')).toBe(true);
  });
});
