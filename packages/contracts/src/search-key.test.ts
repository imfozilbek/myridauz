import { describe, expect, it } from 'vitest';
import { searchKey } from './search-key';

describe('the search key of a place name (G23, docs/67)', () => {
  it('gives Uzbek Latin, Uzbek Cyrillic and Russian spellings of one place the same key', () => {
    expect(searchKey('Chilonzor')).toBe(searchKey('Чиланзар'));
    expect(searchKey('Chilonzor')).toBe(searchKey('Чилонзор'));
    expect(searchKey('Toshkent')).toBe(searchKey('Ташкент'));
    expect(searchKey('Samarqand')).toBe(searchKey('Самарканд'));
    expect(searchKey('Yunusobod')).toBe(searchKey('Юнусабад'));
    expect(searchKey('Mirzo Ulugʻbek')).toBe(searchKey('Мирзо-Улугбек'));
    expect(searchKey('Qoʻqon')).toBe(searchKey('Қўқон'));
    expect(searchKey('Xadra')).toBe(searchKey('Хадра'));
  });

  it('reads every way people type oʻ and gʻ as one letter', () => {
    const key = searchKey('Oʻzbekiston');
    for (const typed of ["O'zbekiston", 'O`zbekiston', 'Oʼzbekiston', 'O’zbekiston', 'Ozbekiston'])
      expect(searchKey(typed)).toBe(key);
  });

  it('keeps numbers and splits words on any sign', () => {
    expect(searchKey('184-maktab')).toBe('184 maktab');
    expect(searchKey('Школа №184')).toBe('maktab 184');
    expect(searchKey('  Chorsu   bozori! ')).toBe('charsu bazari');
  });

  it('never gives two same letters in a row, so the words of the index cannot collide with its cells', () => {
    expect(searchKey('Jizzax')).toBe('jizah');
    expect(searchKey('Zzz')).toBe('z');
  });

  it('gives words of one group the same key (G24, docs/69)', () => {
    const same = [
      ['kvartal 9', 'mavze 9', 'massiv 9', 'квартал 9', 'массив 9'],
      ['rynok', 'bozor', 'bazar', 'рынок', 'базар'],
      ['maktab', 'shkola', 'школа'],
      ['bekat', 'ostanovka', 'остановка'],
      ['shifoxona', 'bolnitsa', 'больница'],
      ['masjid', 'mechet', 'мечеть'],
    ];
    for (const [first = '', ...others] of same)
      for (const word of others) expect(searchKey(word)).toBe(searchKey(first));
    expect(searchKey('Rynok Chorsu')).toBe('bazar charsu');
  });

  it('gives an empty key to text without letters or numbers', () => {
    expect(searchKey(' ,.- ')).toBe('');
  });
});
