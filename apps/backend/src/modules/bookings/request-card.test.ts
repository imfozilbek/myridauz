import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { PLACES } from './card-places';
import { firstOfferRing, requestCard } from './infrastructure/request-card';
import { fakeRequest } from './test-requests';

const NOW = Date.parse('2026-10-01T05:00:00Z');
const card = (status: 'open' | 'expired', offers: number) =>
  requestCard({
    brand: loadBrand(),
    request: { ...fakeRequest('r1'), status, open: status === 'open' },
    offers,
    places: PLACES,
    now: NOW,
  });
const buttons = (shown: { markup?: object }) => JSON.stringify(shown.markup);

// The request card of the passenger bot (G68, docs/122): status, the day, 🟢 🔴, seats and share.
describe('the request card of the passenger bot (G68, docs/122)', () => {
  it('an open request: drivers see it, the day, the route, the seats; on top of the chat', () => {
    const shown = card('open', 0);
    expect(shown.text.split('\n').slice(0, 2)).toEqual([
      '<b>⏳ Soʻrovingizni haydovchilar koʻrmoqda</b>',
      '<b>Ertaga, 2-oktabr</b>',
    ]);
    expect(shown.text).toContain('<blockquote>🟢 <b>Chilonzor</b>, Toshkent shahri</blockquote>');
    expect(shown.text).toMatch(/💺 2 joy · <b>180\s000\ssoʻm<\/b>/u);
    expect(buttons(shown)).toContain('?request=r1');
    expect(shown.pin).toBe(true);
  });

  it('counts the offers and opens them; a burned request has no button and leaves the top', () => {
    const offered = card('open', 2);
    expect(offered.text.split('\n')[0]).toBe('<b>📨 Soʻrovingizga 2 ta taklif keldi</b>');
    expect(buttons(offered)).toContain('Takliflarni koʻrish');
    const burned = card('expired', 2);
    expect(burned.text.split('\n')[0]).toBe('<b>⌛ Soʻrov muddati tugadi</b>');
    expect(burned.markup).toEqual({ inline_keyboard: [] });
    expect(burned.pin).toBe(false);
  });

  it('the first offer rings under the card: who, when, the share; the button opens its sheet (G68)', () => {
    const offer = { id: 'o1', departAt: NOW + 3_600_000, price: 95_000, driver: { firstName: 'Jasur' } };
    const ring = firstOfferRing(loadBrand(), fakeRequest('r1'), offer as never, false);
    expect(ring.text).toMatch(/^📨 Soʻrovingizga taklif keldi: Jasur, \d\d:\d\d, 95\s000\ssoʻm$/u);
    expect(ring.card).toBe('request:r1');
    expect(JSON.stringify(ring.markup)).toContain('?sheet=o1');
  });
});
