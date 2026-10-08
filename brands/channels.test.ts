import { describe, expect, it } from 'vitest';
import { channelOfPlate } from './channels';
import { loadBrand } from './index';

// The zone of a driver by the region of the car plate (G62, docs/119): the first number of the
// region of each zone is its code; Tashkent (01 … 09) has no channel (docs/15).
describe('channelOfPlate', () => {
  const brand = loadBrand();
  it('gives the main zone of the region of the plate', () => {
    expect(channelOfPlate(brand, '30A123BC')?.username).toBe('rida_samarqand');
    expect(channelOfPlate(brand, '39123ABC')?.username).toBe('rida_samarqand');
    expect(channelOfPlate(brand, '40A123BC')?.username).toBe('rida_fargona');
    expect(channelOfPlate(brand, '74A123BC')?.username).toBe('rida_qarshi');
    expect(channelOfPlate(brand, '75A123BC')?.username).toBe('rida_termiz');
    expect(channelOfPlate(brand, '95A123BC')?.username).toBe('rida_nukus');
  });

  it('has no channel for a Tashkent plate', () => {
    expect(channelOfPlate(brand, '01A123BC')).toBeUndefined();
  });
});
