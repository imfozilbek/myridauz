import { describe, expect, it } from 'vitest';
import { maskPlate, plateParts, plateSchema } from './plate';

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

describe('plateParts: the region cell and the number, as on an Uzbek plate (G62)', () => {
  it('splits the region from the number, each with the grey rest of the example', () => {
    expect(plateParts('')).toEqual({ region: '', regionGhost: '01', number: '', numberGhost: 'A 123 BC' });
    expect(plateParts('0')).toEqual({ region: '0', regionGhost: '1', number: '', numberGhost: 'A 123 BC' });
    expect(plateParts('01a12')).toEqual({
      region: '01',
      regionGhost: '',
      number: 'A 12',
      numberGhost: '3 BC',
    });
    expect(plateParts('10123ABC')).toEqual({
      region: '10',
      regionGhost: '',
      number: '123 ABC',
      numberGhost: '',
    });
  });
});

describe('plateSchema: the regions of Uzbekistan are 01 … 99 (G62)', () => {
  it('refuses the region 00', () => {
    expect(plateSchema.safeParse('00A123BC').success).toBe(false);
    expect(plateSchema.safeParse('95A123BC').success).toBe(true);
  });
});
