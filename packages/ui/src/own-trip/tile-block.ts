import type { Trip } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import type { OwnTripTile } from './own-trip-tiles';
import type { TripStage } from './trip-stage';

type Now = {
  readonly trip: Trip;
  readonly stage: TripStage;
  // The Telegram of the driver can post a story.
  readonly stories: boolean;
  // The confirmed passengers the map shows.
  readonly riders: number;
};

// Why a tile of «Mening safarim» cannot work now, or null when it works. The tiles never hide
// (docs/121): a tile that cannot work says why on its tap, by the stage of the trip.
export function tileBlock(tile: OwnTripTile, { trip, stage, stories, riders }: Now): TranslationKey | null {
  // An over trip has one reason for every tile: how it ended.
  if (stage === 'over') return trip.status === 'cancelled' ? 'market.trip.cancelled' : 'bookings.done.title';
  if (tile === 'story') {
    if (!stories) return 'driverTrip.story.noApp';
    if (stage === 'on_way') return 'driverTrip.story.left';
    return trip.status === 'active' ? null : 'driverTrip.story.closed';
  }
  if (tile === 'change') return stage === 'on_way' ? 'driverTrip.change.closed' : null;
  if (tile === 'map') return riders > 0 ? null : 'way.map.empty';
  return null;
}
