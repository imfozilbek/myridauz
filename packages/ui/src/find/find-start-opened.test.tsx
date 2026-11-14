import { toCyrillic } from '@platform/i18n';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderMarket, ROUTE } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { searchMarket } from './search-test-kit';
import { FindStart } from './find-start';

afterEach(cleanup);

// «Qayerga» of the main screen opens this route by itself: «Ilovani ochdi» stayed 0 while
// «Qayerdan tanladi» was 1 on prod 14.11.2026 (G96).
describe('FindStart: «Ilovani ochdi» from every way in', () => {
  it('tracks «opened» once when the route opens, also with «Qayerdan» known', async () => {
    const { tracked } = renderMarket(
      <FindStart from={ROUTE.from} onBack={() => undefined} onDone={() => undefined} />,
      testClients({ market: searchMarket([0, 3]) }),
    );
    expect(await screen.findByText(toCyrillic('Qayerga borasiz?'))).toBeTruthy();
    await waitFor(() => {
      const way = tracked.filter((event) => event.name === 'way_step').map((event) => event.step);
      expect(way.filter((step) => step === 'opened')).toHaveLength(1);
    });
  });
});
