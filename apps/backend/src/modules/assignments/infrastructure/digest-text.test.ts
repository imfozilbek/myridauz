import { describe, expect, it } from 'vitest';
import { digestText } from './digest-text';

const NAMES = new Map([
  [1, 'Ali'],
  [2, 'Kamron'],
]);

describe('the text of the digest (docs/92)', () => {
  it('has the day, a line per member and the unanswered questions', () => {
    const rows = [
      { memberId: 1, total: 6, answered: 5, applications: 3 },
      { memberId: 2, total: 6, answered: 6, applications: 2 },
    ];
    expect(digestText('2026-10-02', rows, (id) => NAMES.get(id) ?? '')).toBe(
      [
        '📊 Jamoa ishi: 2-oktabr',
        'Ali: murojaat 5/6, ariza 3',
        'Kamron: murojaat 6/6, ariza 2',
        'Javobsiz murojaatlar: 1',
      ].join('\n'),
    );
  });

  it('says nothing about unanswered questions when all have an answer', () => {
    const text = digestText(
      '2026-10-02',
      [{ memberId: 2, total: 1, answered: 1, applications: 0 }],
      () => 'Kamron',
    );
    expect(text).not.toContain('Javobsiz');
  });
});
