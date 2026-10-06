import type { BrandChannel } from '@platform/brands';
import type { NotificationJob } from '../../notifications';

export type ZoneInviteDeps = {
  // Off until the owner switches the channel posts on: an empty channel is no reason to join (docs/33).
  readonly enabled: boolean;
  // true once per person: the users module keeps it (docs/119).
  readonly claim: (userId: number) => Promise<boolean>;
  // Already in the channel: no invite. Unknown counts as not in.
  readonly inChannel: (username: string, userId: number) => Promise<boolean>;
  readonly message: (userId: number, zone: BrandChannel) => NotificationJob;
  readonly send: (jobs: readonly NotificationJob[]) => Promise<void>;
};

// A district, a city or a one-city region tells where a person lives; a region of several zones
// does not yet (docs/63).
type Place = { readonly parentId: string | null; readonly oneCity: boolean };
export const tellsHome = (place: Place | undefined) =>
  place !== undefined && (place.parentId !== null || place.oneCity);

// The passenger bot invites a new person to the channel of the zone where they live, once (docs/119
// row 6). The first place known of the person decides: Toshkent has no channel (docs/15), and a
// place without a zone gets nothing, now and later. A failed message never stops the person.
export async function inviteToZone(deps: ZoneInviteDeps, userId: number, zone: BrandChannel | undefined) {
  if (!deps.enabled || !(await deps.claim(userId)) || !zone) return;
  try {
    if (await deps.inChannel(zone.username, userId)) return;
    await deps.send([deps.message(userId, zone)]);
  } catch (error) {
    console.warn(JSON.stringify({ event: 'zone_invite_failed', message: String(error) }));
  }
}
