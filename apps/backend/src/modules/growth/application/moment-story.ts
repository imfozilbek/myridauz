import { MAX_STORY_BYTES, STORY_TYPE } from '@platform/contracts';
import type { ImageStore } from '../../../shared/storage/image-store';
import { storyKey } from '../../../shared/storage/story-key';
import type { GrowthStore } from './ports';

export type StoryDeps = {
  readonly store: GrowthStore;
  readonly stories: ImageStore;
  readonly newId: () => string;
};

type Saved = { readonly ok: true; readonly id: string } | { readonly ok: false; readonly error: StoryError };
type StoryError = 'growth.not_found' | 'growth.invalid_image';

// «Hikoyamga joylash» (docs/123): the card drawn by the Mini App, kept a day under a new id. Only a
// person who was offered a moment: the public link holds no other picture.
export async function saveMomentStory(
  deps: StoryDeps,
  userId: number,
  image: { readonly body: ArrayBuffer; readonly type: string },
): Promise<Saved> {
  if ((await deps.store.offered(userId)).length === 0) return { ok: false, error: 'growth.not_found' };
  const size = image.body.byteLength;
  if (image.type !== STORY_TYPE || size === 0 || size > MAX_STORY_BYTES) {
    return { ok: false, error: 'growth.invalid_image' };
  }
  const id = deps.newId();
  await deps.stories.put(storyKey(id), image.body, image.type);
  return { ok: true, id };
}
