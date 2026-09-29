import { describe, expect, it } from 'vitest';
import { maskPlate } from './plate';

describe('maskPlate: the plate field (docs/50)', () => {
  it('shows the whole example while empty', () => {
    expect(maskPlate('')).toEqual({ value: '', ghost: '01 A 123 BC' });
  });

  it('keeps a person plate, capitals and spaces by itself', () => {
    expect(maskPlate('01a1')).toEqual({ value: '01 A 1', ghost: '23 BC' });
    expect(maskPlate('01a123bc')).toEqual({ value: '01 A 123 BC', ghost: '' });
  });

  it('turns to a company plate when the third place is a digit', () => {
    expect(maskPlate('011')).toEqual({ value: '01 1', ghost: '23 ABC' });
    expect(maskPlate('10 123 abc')).toEqual({ value: '10 123 ABC', ghost: '' });
  });

  it('drops what does not fit its place, Cyrillic and extra characters', () => {
    expect(maskPlate('a0б1-Жa12x3bcdef')).toEqual({ value: '01 A 123 BC', ghost: '' });
    expect(maskPlate('01 A 123 BC 99')).toEqual({ value: '01 A 123 BC', ghost: '' });
  });
});
