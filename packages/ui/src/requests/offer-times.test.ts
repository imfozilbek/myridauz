import { describe, expect, it } from 'vitest';
import { offerTimes } from './offer-times';

const every30 = (from: string) => {
  const [hours = 0, minutes = 0] = from.split(':').map(Number);
  const slots: string[] = [];
  for (let at = hours * 60 + minutes; at < 24 * 60; at += 30)
    slots.push(`${String(Math.floor(at / 60)).padStart(2, '0')}:${String(at % 60).padStart(2, '0')}`);
  return slots;
};

// The three time buttons of an offer (G64, mockups g64/1 and g64/3).
describe('the time buttons of an offer (G64)', () => {
  it('gives 06:00, 08:00 and 10:00 on a free day', () => {
    expect(offerTimes(every30('00:00'))).toEqual(['06:00', '08:00', '10:00']);
  });

  it('starts at the first even hour after the lead time today', () => {
    expect(offerTimes(every30('13:30'))).toEqual(['14:00', '16:00', '18:00']);
  });

  it('gives fewer buttons late in the evening and none at night', () => {
    expect(offerTimes(every30('21:00'))).toEqual(['22:00']);
    expect(offerTimes(every30('23:00'))).toEqual([]);
  });
});
