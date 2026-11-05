import { describe, expect, it } from 'vitest';
import { toCyrillic } from './cyrillic';
import { placeEnd } from './place-end';

describe('toCyrillic (G94, docs/223)', () => {
  it('writes the letters and pairs of Uzbek Latin in Cyrillic', () => {
    expect(toCyrillic('Yunusoboddan (Toshkent shahri), uyingizdan')).toBe(
      'Юнусободдан (Тошкент шаҳри), уйингиздан',
    );
    expect(toCyrillic('Yakkabogʻgacha · Qashqadaryo viloyati')).toBe('Яккабоғгача · Қашқадарё вилояти');
    expect(toCyrillic('Yoʻlovchini olish, choy, yangi')).toBe('Йўловчини олиш, чой, янги');
  });

  it('keeps the case as written', () => {
    expect(toCyrillic('BOʻSH MASHINA KERAK')).toBe('БЎШ МАШИНА КЕРАК');
    expect(toCyrillic('Ertaga')).toBe('Эртага');
  });

  it('writes «e» at the start as «э», «ye» after a vowel as «е», «ʼ» as «ъ»', () => {
    expect(toCyrillic('eʼlon, oyeh, yetadi')).toBe('эълон, оеҳ, етади');
  });

  it('writes «ts» of a borrowed word as «ц», a verb keeps «тс»', () => {
    expect(toCyrillic('konditsioner, ketsa')).toBe('кондиционер, кетса');
  });

  it('writes the months with «я» the Latin does not show', () => {
    expect(toCyrillic('5-oktabr, 6-noyabr')).toBe('5-октябр, 6-ноябр');
  });

  it('keeps HTML marks, links, @names and the words it is told to keep', () => {
    const text =
      '<b>BOʻSH Gentra</b> <tg-emoji emoji-id="1">🟧</tg-emoji> Brend &amp; https://t.me/x_bot @brend';
    expect(toCyrillic(text, ['Gentra', 'Brend'])).toBe(
      '<b>БЎШ Gentra</b> <tg-emoji emoji-id="1">🟧</tg-emoji> Brend &amp; https://t.me/x_bot @brend',
    );
  });
});

describe('placeEnd (docs/25)', () => {
  it('names the last letter that changes «-ga»', () => {
    expect(placeEnd('Muborak')).toBe('k');
    expect(placeEnd('Chortoq')).toBe('q');
    expect(placeEnd('Yakkabogʻ')).toBe('other');
  });
});
