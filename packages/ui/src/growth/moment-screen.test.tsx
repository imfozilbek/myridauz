import type { GrowthClient } from '@platform/api-client';
import type { Moment, ShareMoment } from '@platform/contracts';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { MomentGate } from './moment-gate';
import { MomentScreen } from './moment-screen';

afterEach(cleanup);

type Found = Moment & { readonly moment: ShareMoment };
const DRIVER: Found = { moment: 'driver', link: 'https://t.me/brand_bot?startapp=__share-driver-a1b2c3' };

function open(found: Found, growth: Partial<GrowthClient> = {}) {
  const offered = vi.fn<GrowthClient['offered']>(async () => undefined);
  const onDone = vi.fn();
  const view = renderMarket(
    <MomentScreen found={found} onDone={onDone} />,
    testClients({ growth: { offered, ...growth } }),
  );
  return { ...view, offered, onDone };
}

// The celebration of a moment «Men Rida bilan» (G69, docs/123, mockups g69/1 … 3): only the approval of
// a driver. No moment after a trip (owner decision 15.10.2026) nor after the registration (18.10.2026).
describe('the celebration of a moment', () => {
  it('says what happened, why to tell and shows the card the passengers see, offered once', async () => {
    const { offered } = open(DRIVER);
    expect(await screen.findByText(/^Siz endi .+ haydovchisisiz! ✅$/u)).toBeTruthy();
    expect(screen.getByText(/^Doimiy yoʻlovchilaringizga ayting: endi sizni .+ da topadi\.$/u)).toBeTruthy();
    expect(screen.getByText('Yoʻlovchilar sizni topadi.')).toBeTruthy();
    expect(screen.getByText('Qaysi soʻz sizniki?')).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByText(/^«Men .+ haydovchisiman»$/u)).toBeTruthy();
    expect(screen.getByText('Ali')).toBeTruthy();
    expect(screen.getByText('Keyinroq')).toBeTruthy();
    await waitFor(() => expect(offered).toHaveBeenCalledWith('driver'));
  });

  it('sends the card with the chosen phrase to the own passengers', async () => {
    const momentCard = vi.fn<GrowthClient['momentCard']>(async () => ({
      prepared: null,
      link: DRIVER.link,
      text: '«Viloyatga men bilan yuring»',
    }));
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    const { tracked } = open(DRIVER, { momentCard });
    await tap('Viloyatga men bilan yuring');
    expect(screen.getByText('«Viloyatga men bilan yuring»')).toBeTruthy();
    await tap('Yoʻlovchilarimga yuborish');
    await waitFor(() => expect(opened).toHaveBeenCalled());
    expect(momentCard).toHaveBeenCalledWith('driver', 2);
    expect(tracked.filter((event) => event.name.startsWith('share_'))).toMatchObject([
      { name: 'share_shown', button: 'share-driver' },
      { name: 'share_done', button: 'share-driver', target: 'chat' },
    ]);
    opened.mockRestore();
  });

  it('goes on with «Keyinroq»', async () => {
    const { onDone } = open(DRIVER);
    await tap('Keyinroq');
    expect(onDone).toHaveBeenCalled();
  });

  it('greets a new driver once at a launch without a link, over the page; a passenger app asks nothing', async () => {
    const moment = vi.fn<GrowthClient['moment']>(async () => DRIVER);
    const clients = testClients({ growth: { moment, offered: async () => undefined } });
    const gate = (enabled: boolean) =>
      renderMarket(
        <MomentGate enabled={enabled}>
          <p>Asosiy</p>
        </MomentGate>,
        clients,
      );
    gate(false);
    expect(screen.getByText('Asosiy')).toBeTruthy();
    expect(moment).not.toHaveBeenCalled();
    cleanup();
    gate(true);
    expect(await screen.findByText(/^Siz endi .+ haydovchisisiz! ✅$/u)).toBeTruthy();
    await tap('Keyinroq');
    expect(screen.getByText('Asosiy')).toBeTruthy();
    cleanup();
    gate(true);
    expect(screen.getByText('Asosiy')).toBeTruthy();
    expect(moment).toHaveBeenCalledTimes(1);
  });
});
