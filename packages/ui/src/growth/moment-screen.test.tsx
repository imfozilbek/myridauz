import type { GrowthClient } from '@platform/api-client';
import type { Moment } from '@platform/contracts';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { MomentGate, MomentStep } from './moment-step';

afterEach(cleanup);

const TRIP: Moment = {
  moment: 'trip1',
  route: { from: '1726269', to: '1730401' },
  people: 4,
  link: 'https://t.me/brand_bot?startapp=find_1726269_1730401__share-trip-a1b2c3',
};

function open(found: Moment, growth: Partial<GrowthClient> = {}) {
  const offered = vi.fn<GrowthClient['offered']>(async () => undefined);
  const onDone = vi.fn();
  const view = renderMarket(
    <MomentStep onDone={onDone} />,
    testClients({ growth: { moment: async () => found, offered, ...growth } }),
  );
  return { ...view, offered, onDone };
}

// The celebration of a moment «Men Rida bilan» (G69, docs/123, mockups g69/1 … 3).
describe('the celebration of a moment', () => {
  it('says what happened, why to tell friends and shows the card a friend sees, offered once', async () => {
    const { offered } = open(TRIP);
    expect(await screen.findByText('Yetib keldingiz! 🏁')).toBeTruthy();
    expect(screen.getByText('Chilonzor → Fargʻona shahri: bir mashina, xarajat 4 ga boʻlindi.')).toBeTruthy();
    expect(screen.getByText('Doʻstlaringiz ham shunday borsin.')).toBeTruthy();
    expect(screen.getByText('Qaysi soʻz sizniki?')).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByText('«Fargʻona shahriga 4 kishi boʻlib bordik!»')).toBeTruthy();
    expect(screen.getByText('Ali · Chilonzor → Fargʻona shahri')).toBeTruthy();
    expect(screen.getByText('Keyinroq')).toBeTruthy();
    await waitFor(() => expect(offered).toHaveBeenCalledWith('trip1'));
  });

  it('sends the card with the chosen phrase to the friends going the same way', async () => {
    const momentCard = vi.fn<GrowthClient['momentCard']>(async () => ({ prepared: null, link: TRIP.link }));
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    const { tracked } = open(TRIP, { momentCard });
    await tap('Yoʻl xarajatini birga boʻldik');
    expect(screen.getByText('«Yoʻl xarajatini birga boʻldik»')).toBeTruthy();
    await tap('Fargʻona shahriga boradigan doʻstimga');
    await waitFor(() => expect(opened).toHaveBeenCalled());
    expect(momentCard).toHaveBeenCalledWith('trip1', 1);
    expect(tracked.filter((event) => event.name.startsWith('share_'))).toMatchObject([
      { name: 'share_shown', button: 'share-trip' },
      { name: 'share_done', button: 'share-trip', target: 'chat' },
    ]);
    opened.mockRestore();
  });

  it('lets the driver tell the own passengers, and «Keyinroq» goes on', async () => {
    const { onDone } = open({ moment: 'riders10', route: TRIP.route, people: 12, link: TRIP.link });
    expect(await screen.findByText('10 yoʻlovchi! 🏅')).toBeTruthy();
    expect(screen.getByText('Yoʻlovchilarimga yuborish')).toBeTruthy();
    await tap('Keyinroq');
    expect(onDone).toHaveBeenCalled();
  });

  it('goes straight on without a moment', async () => {
    const { onDone } = open({ moment: null, route: null, people: 0, link: '' });
    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it('greets a new passenger once at a launch without a link, over the page', async () => {
    const join: Moment = {
      moment: 'join',
      route: null,
      people: 0,
      link: 'https://t.me/b?startapp=__share-join-a1b2c3',
    };
    const offered = vi.fn<GrowthClient['offered']>(async () => undefined);
    const clients = testClients({ growth: { moment: async () => join, offered } });
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
