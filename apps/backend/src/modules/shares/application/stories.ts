import { MAX_STORY_BYTES, STORY_TYPE } from '@platform/contracts';
import type { ImageStore, StoredImage } from '../../../shared/storage/image-store';
import type { DriverTrip, Result } from './ports';

export type StoriesDeps = {
  readonly driverTrip: (id: string) => Promise<DriverTrip | undefined>;
  readonly stories: ImageStore;
};

type StoryError = 'shares.not_found' | 'shares.wrong_status' | 'shares.invalid_image';

// One picture per trip: a new story of the same trip replaces it (docs/88 L19).
const storyKey = (tripId: string) => `stories/${tripId}`;

// Only the driver of an open trip with free seats: a story calls people to book (docs/88 L19).
export async function saveStory(
  deps: StoriesDeps,
  driverId: number,
  tripId: string,
  image: { readonly body: ArrayBuffer; readonly type: string },
): Promise<Result<true, StoryError>> {
  const trip = await deps.driverTrip(tripId);
  if (trip?.driverId !== driverId) return { ok: false, error: 'shares.not_found' };
  if (trip.status !== 'active') return { ok: false, error: 'shares.wrong_status' };
  const size = image.body.byteLength;
  if (image.type !== STORY_TYPE || size === 0 || size > MAX_STORY_BYTES) {
    return { ok: false, error: 'shares.invalid_image' };
  }
  await deps.stories.put(storyKey(tripId), image.body, image.type);
  return { ok: true, value: true };
}

export const readStory = (deps: StoriesDeps, tripId: string): Promise<StoredImage | undefined> =>
  deps.stories.get(storyKey(tripId));
