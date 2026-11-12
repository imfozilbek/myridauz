import { describe, expect, it } from 'vitest';
import { byCyrillic } from './cyrillic-order';

describe('the order of the Uzbek Cyrillic alphabet (G98, lesson 392)', () => {
  it('puts ў, қ, ғ, ҳ after я and a shorter name first', () => {
    const places = ['Ҳазорасп', 'Қўшкўпир', 'Шовот', 'Боғот', 'Урганч шаҳри', 'Урганч', 'Янгиариқ', 'Ўрта'];
    expect([...places].sort(byCyrillic)).toEqual([
      'Боғот',
      'Урганч',
      'Урганч шаҳри',
      'Шовот',
      'Янгиариқ',
      'Ўрта',
      'Қўшкўпир',
      'Ҳазорасп',
    ]);
  });
});
