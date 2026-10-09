import { describe, expect, it } from 'vitest';
import { digestText } from './digest-text';

const NAMES = new Map([
  [1, 'Ali'],
  [2, 'Kamron'],
]);
const NUMBERS = { newUsers: 24, trips: 17, bookings: 41, fromChannels: 31 };

// The summary of the day for the owner (G68, docs/122, mockup g68/4).
describe('the text of the summary of the day', () => {
  it('has the day, its numbers, a line per member, the unanswered questions and the channels', () => {
    const rows = [
      { memberId: 1, total: 6, answered: 5, applications: 3 },
      { memberId: 2, total: 6, answered: 6, applications: 2 },
    ];
    expect(digestText('2026-10-02', rows, NUMBERS, (id) => NAMES.get(id) ?? '')).toBe(
      [
        '<b>📊 Kun yakuni · 2-oktabr</b>',
        '24 yangi odam · 17 safar · 41 bron',
        '',
        '<b>👥 Jamoa</b>',
        'Ali: murojaat 5/6, ariza 3',
        'Kamron: murojaat 6/6, ariza 2',
        'Javobsiz murojaatlar: 1',
        '',
        '📣 Kanaldan keldi: 31 kishi',
      ].join('\n'),
    );
  });

  it('says nothing about unanswered questions when all have an answer', () => {
    const rows = [{ memberId: 2, total: 1, answered: 1, applications: 0 }];
    expect(digestText('2026-10-02', rows, NUMBERS, () => 'Kamron')).not.toContain('Javobsiz');
  });
});
