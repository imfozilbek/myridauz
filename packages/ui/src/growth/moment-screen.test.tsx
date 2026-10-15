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
const JOIN: Found = { moment: 'join', link: 'https://t.me/brand_bot?startapp=__share-join-a1b2c3' };
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

// The celebration of a moment «Men Rida bilan» (G69, docs/123, mockups g69/1 … 3). No moment after a
// trip (owner decision 15.10.2026): the registration and the approval of a driver.
describe('the celebration of a moment', () => {
  it('says what happened, why to tell friends and shows the card a friend sees, offered once', async () => {
    const { offered } = open(JOIN);
    expect(await screen.findByText(/^Siz .+ jamoasidasiz! 🎉$/u)).toBeTruthy();
    expect(screen.getByText('Doʻstlaringizga ayting: ular ham viloyatga birga borsin.')).toBeTruthy();
    expect(screen.getByText('Doʻstlaringiz ham shunday borsin.')).toBeTruthy();
    expect(screen.getByText('Qaysi soʻz sizniki?')).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByText(/^«Men endi .+ jamoasidaman!»$/u)).toBeTruthy();
    expect(screen.getByText('Ali')).toBeTruthy();
    expect(screen.getByText('Keyinroq')).toBeTruthy();
    await waitFor(() => expect(offered).toHaveBeenCalledWith('join'));
  });

  it('sends the card with the chosen phrase to the friends', async () => {
    const momentCard = vi.fn<GrowthClient['momentCard']>(async () => ({ prepared: null, link: JOIN.link }));
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    const { tracked } = open(JOIN, { momentCard });
    await tap('Viloyatga endi birga boraman');
    expect(screen.getByText('«Viloyatga endi birga boraman»')).toBeTruthy();
    await tap('Doʻstlarimga yuborish');
    await waitFor(() => expect(opened).toHaveBeenCalled());
    expect(momentCard).toHaveBeenCalledWith('join', 1);
    expect(tracked.filter((event) => event.name.startsWith('share_'))).toMatchObject([
      { name: 'share_shown', button: 'share-join' },
      { name: 'share_done', button: 'share-join', target: 'chat' },
    ]);
    opened.mockRestore();
  });

  it('lets a new driver tell the own passengers, and «Keyinroq» goes on', async () => {
    const { onDone } = open(DRIVER);
    expect(await screen.findByText(/^Siz endi .+ haydovchisisiz! ✅$/u)).toBeTruthy();
    expect(screen.getByText('Yoʻlovchilarimga yuborish')).toBeTruthy();
    await tap('Keyinroq');
    expect(onDone).toHaveBeenCalled();
  });

  it('greets a new passenger once at a launch without a link, over the page', async () => {
    const offered = vi.fn<GrowthClient['offered']>(async () => undefined);
    const clients = testClients({ growth: { moment: async () => JOIN, offered } });
    renderMarket(
      <MomentGate enabled>
        <p>Asosiy</p>
      </MomentGate>,
      clients,
    );
    expect(await screen.findByText(/^Siz .+ jamoasidasiz! 🎉$/u)).toBeTruthy();
    expect(screen.getByText('Ali')).toBeTruthy();
    await tap('Keyinroq');
    expect(screen.getByText('Asosiy')).toBeTruthy();
    cleanup();
    renderMarket(
      <MomentGate enabled>
        <p>Asosiy</p>
      </MomentGate>,
      clients,
    );
    expect(screen.getByText('Asosiy')).toBeTruthy();
  });
});
