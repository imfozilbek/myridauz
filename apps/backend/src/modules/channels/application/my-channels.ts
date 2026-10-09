import type { BrandChannel } from '@platform/brands';
import type { MyChannel } from '@platform/contracts';

// «missing»: no answer, the channel is not there yet or the bot is not its admin (OPS-02).
export type Membership = 'in' | 'out' | 'missing';

export type MyChannelsDeps = {
  // The channels of the zones of the brand (docs/63).
  readonly zones: readonly BrandChannel[];
  readonly membership: (username: string, userId: number) => Promise<Membership>;
};

// «Kanallar» of a person (G65, docs/119): the zones whose channel is there, «✓ Aʼzosiz» on the ones
// the person is in. A channel the team has not made yet (OPS-02) has no row.
export async function myChannels(deps: MyChannelsDeps, userId: number): Promise<MyChannel[]> {
  const found = await Promise.all(
    deps.zones.map(async ({ username }) => ({ username, state: await deps.membership(username, userId) })),
  );
  return found
    .filter(({ state }) => state !== 'missing')
    .map(({ username, state }) => ({ username, member: state === 'in' }));
}
