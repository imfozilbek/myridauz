import { describe, expect, it } from 'vitest';
import { navigatorUrl } from './navigator';

const A = { lat: 41.3, lng: 69.2 };
const B = { lat: 41.31, lng: 69.25 };
const C = { lat: 39.65, lng: 66.97 };

describe('one route through every stop (G24, docs/70)', () => {
  it('builds the link of each navigator, from where the driver stands', () => {
    expect(navigatorUrl('yandex', [A, B, C])).toBe(
      'https://yandex.uz/maps/?rtext=~41.3,69.2~41.31,69.25~39.65,66.97&rtt=auto',
    );
    expect(navigatorUrl('google', [A, B, C])).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=39.65,66.97&travelmode=driving' +
        '&waypoints=41.3%2C69.2%7C41.31%2C69.25',
    );
    expect(navigatorUrl('apple', [A, B])).toBe('https://maps.apple.com/?daddr=41.3,69.2&dirflg=d');
  });

  it('keeps Google within its limit and gives nothing without stops', () => {
    const many = Array.from({ length: 14 }, (_, index) => ({ lat: 41 + index / 100, lng: 69 }));
    const waypoints = navigatorUrl('google', many)?.split('&waypoints=')[1] ?? '';
    expect(decodeURIComponent(waypoints).split('|')).toHaveLength(9);
    expect(navigatorUrl('yandex', [])).toBeNull();
  });
});
