import { describe, expect, it } from 'vitest';
import type { ShareMoment } from '@platform/contracts';
import { momentCard, offerMoment } from './application/cards';
import { dueMoment } from './application/moments';
import type { CardDeps } from './application/cards';
import type { CardMessage, Side } from './application/ports';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-10-15T05:00:00Z');

type World = { approvedAt?: number | null; offered?: ShareMoment[] };

function deps(world: World) {
  const prepared: { side: Side; message: CardMessage; link: string }[] = [];
  const offers: ShareMoment[] = [];
  const value: CardDeps = {
    store: {
      codeOf: async () => 'a1b2c3',
      impactOf: async () => ({ joined: 0, rode: 0 }),
      offered: async () => world.offered ?? [],
      offer: async (_userId, moment) => void offers.push(moment),
      approvedAt: async () => world.approvedAt ?? null,
    },
    passengerBot: 'brand_bot',
    now: () => NOW,
    nameOf: async () => 'Madina',
    message: (input) => ({
      text: `${input.moment}:${input.phrase}:${input.name}`,
      words: { title: 't', button: 'b' },
    }),
    prepare: async (side, _userId, message, link) => {
      prepared.push({ side, message, link });
      return 'prepared-1';
    },
  };
  return { value, prepared, offers };
}

const due = async (world: World, side: Side = 'passenger') =>
  (await dueMoment(deps(world).value, 7, side)).moment;

// The moments of the cards of a person (G69, docs/123): the right moment, fresh, once. No moment after
// a trip (owner decision 15.10.2026) nor after the registration (18.10.2026).
describe('the moments of the cards of a person', () => {
  it('greets nobody for the registration, a passenger has no moment', async () => {
    expect(await due({})).toBeNull();
    expect(await due({ approvedAt: NOW - DAY })).toBeNull();
  });

  it('greets a new driver a week after the approval', async () => {
    expect(await due({ approvedAt: NOW - 3 * DAY }, 'driver')).toBe('driver');
    expect(await due({ approvedAt: NOW - 8 * DAY }, 'driver')).toBeNull();
    expect(await due({}, 'driver')).toBeNull();
  });

  it('never offers a moment twice, nor one the person did not reach', async () => {
    const { value, offers } = deps({ approvedAt: NOW - DAY });
    expect(await offerMoment(value, 7, 'driver')).toBe(true);
    expect(offers).toEqual(['driver']);
    expect(await due({ approvedAt: NOW - DAY, offered: ['driver'] }, 'driver')).toBeNull();
    const stranger = deps({});
    expect(await offerMoment(stranger.value, 7, 'driver')).toBe(false);
    expect(stranger.offers).toEqual([]);
  });

  it('leads a card to the start of the bot with the loop and the code', async () => {
    expect(await dueMoment(deps({ approvedAt: NOW - DAY }).value, 7, 'driver')).toEqual({
      moment: 'driver',
      link: 'https://t.me/brand_bot?startapp=__share-driver-a1b2c3',
    });
  });

  it('makes a chat card only of a moment the person reached, from the driver app', async () => {
    expect(await momentCard(deps({}).value, 7, 'driver', 0)).toBeNull();
    const { value, prepared } = deps({ approvedAt: NOW - DAY });
    expect(await momentCard(value, 7, 'driver', 2)).toEqual({
      prepared: 'prepared-1',
      link: 'https://t.me/brand_bot?startapp=__share-driver-a1b2c3',
      // The words for an old Telegram without shareMessage (G88).
      text: 'driver:2:Madina',
    });
    expect(prepared).toMatchObject([{ side: 'driver', message: { text: 'driver:2:Madina' } }]);
    const offered = deps({ approvedAt: NOW - 30 * DAY, offered: ['driver'] });
    expect(await momentCard(offered.value, 7, 'driver', 0)).not.toBeNull();
  });
});
