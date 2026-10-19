import { describe, expect, it } from 'vitest';
import { toLatin } from './latin';

// A place name of the map as people read it in the product: Uzbek Latin by docs/25 (G48, docs/100 F1).
describe('a place name in Uzbek Latin', () => {
  it('writes Uzbek Cyrillic with oʻ, gʻ and the tutuq sign of docs/25', () => {
    expect(toLatin('Тошкуприк кўчаси')).toBe('Toshkuprik koʻchasi');
    expect(toLatin('Ғишт кўприк')).toBe('Gʻisht koʻprik');
    expect(toLatin('Қўқон')).toBe('Qoʻqon');
    expect(toLatin('Ҳамза')).toBe('Hamza');
    expect(toLatin('Маъмур')).toBe('Maʼmur');
    expect(toLatin('Ёшлар Маркази')).toBe('Yoshlar Markazi');
    // Tajik names near the border: «ҷ», «ӣ».
    expect(toLatin('Панҷакент, Сомонӣ')).toBe('Panjakent, Somoni');
  });

  it('writes «е» as «ye» at the start of a word and after a vowel, «ц» as «ts» after a vowel', () => {
    expect(toLatin('Елена')).toBe('Yelena');
    expect(toLatin('Шаршара')).toBe('Sharshara');
    expect(toLatin('Лицей')).toBe('Litsey');
    expect(toLatin('Центр')).toBe('Sentr');
    expect(toLatin('Подъезд')).toBe('Podʼyezd');
    expect(toLatin('Районная поликлиника')).toBe('Rayonnaya poliklinika');
  });

  it('keeps a word in capitals in capitals and the rest of the name as it is', () => {
    expect(toLatin('ШКОЛА №6')).toBe('SHKOLA №6');
    expect(toLatin('РОВД')).toBe('ROVD');
    expect(toLatin('"Барака" маркет')).toBe('"Baraka" market');
    expect(toLatin('Чорсу')).toBe('Chorsu');
  });

  it("mends a Latin name with Cyrillic look-alikes and with o', g' typed as apostrophes", () => {
    expect(toLatin('Tаqıyatas')).toBe('Taqıyatas');
    expect(toLatin("Mаxtumkuli ko''chasi")).toBe('Maxtumkuli koʻchasi');
    expect(toLatin('O’zbеkiston pochtasi')).toBe('Oʻzbekiston pochtasi');
    expect(toLatin("Ta'lim markazi")).toBe('Taʼlim markazi');
    expect(toLatin('Chilonzor bozori')).toBe('Chilonzor bozori');
  });
});
