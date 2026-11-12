import { toCyrillic } from '@platform/i18n';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ROUTE, tap } from './market-test-kit';
import { openNewTrip } from './new-trip-test-kit';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

// «Qayerdan» emptied by its «x» in the block (G79 В4): «Qayerga» is kept, «Qayerdan» is asked first.
describe('a new trip from «Qayerga» of the block only', { timeout: 20_000 }, () => {
  it('asks «Qayerdan», then opens the trip on the whole route', async () => {
    openNewTrip({ to: ROUTE.to });
    expect(await screen.findByText(toCyrillic('Qayerdan yoʻlga chiqasiz?'))).toBeTruthy();
    await tap(toCyrillic('Toshkent shahri'));
    await tap(toCyrillic('Chilonzor'));
    expect(await screen.findByText(toCyrillic('Safar eʼlon qilish'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Chilonzor, Toshkent shahri'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Fargʻona shahri'))).toBeTruthy();
  });
});
