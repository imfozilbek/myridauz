import { toCyrillic } from '@platform/i18n';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recommendation, ROUTE, tap } from './market-test-kit';
import { openNewTrip } from './new-trip-test-kit';

// A whole region, as the block of the main screen gave it before 13.11.2026 (docs/233 №1).
const REGION = {
  id: '1730',
  parentId: null,
  type: 'region',
  name: toCyrillic('Fargʻona viloyati'),
  lat: 40.38,
  lng: 71.78,
};
const FROM_TITLE = toCyrillic('Qayerdan yoʻlga chiqasiz?');

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const saveDraft = (screenName: string) =>
  localStorage.setItem(
    'draft:new_trip',
    JSON.stringify({
      at: Date.now(),
      value: { screen: screenName, answer: { route: { from: ROUTE.from, to: REGION }, seats: 3 } },
    }),
  );

describe('G96: a trip never asks the price or publishes with a whole region (prod 14.11.2026)', () => {
  it.each(['form', 'when'])(
    'a draft on «%s» with a region opens the route and asks nothing',
    async (name) => {
      saveDraft(name);
      const recommend = vi.fn(async () => recommendation);
      openNewTrip({ recommend });
      expect(await screen.findByText(FROM_TITLE)).toBeTruthy();
      expect(screen.queryByText(toCyrillic('Fargʻona viloyati'))).toBeNull();
      expect(recommend).not.toHaveBeenCalled();
    },
  );

  it('a refused route comes back to the route without the region; «Davom etish» asks it again', async () => {
    const recommend = vi.fn(() => Promise.reject(new Error('locations.not_found')));
    openNewTrip({ recommend, route: { from: ROUTE.from, to: REGION as typeof ROUTE.to } });
    expect(await screen.findByText(toCyrillic('Chilonzor'))).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Fargʻona viloyati'))).toBeNull();
    await tap(toCyrillic('Davom etish'));
    expect(await screen.findByText(toCyrillic('Qayerga borasiz?'))).toBeTruthy();
  });
});
