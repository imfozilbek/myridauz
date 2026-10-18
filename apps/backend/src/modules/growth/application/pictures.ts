import { MAX_STORY_BYTES, QR_TYPE, STORY_TYPE } from '@platform/contracts';
import type { ImageStore } from '../../../shared/storage/image-store';
import { storyKey } from '../../../shared/storage/story-key';
import type { GrowthStore } from './ports';

export type StoryDeps = {
  readonly store: GrowthStore;
  readonly stories: ImageStore;
  readonly newId: () => string;
};

type Saved =
  { readonly ok: true; readonly id: string } | { readonly ok: false; readonly error: PictureError };
type PictureError = 'growth.not_found' | 'growth.invalid_image';
// The story of a moment for a person who was offered one; the QR on the glass and the picture of the
// trip's chat card (G88) for an approved driver.
export type PictureKind = 'moment' | 'qr' | 'card';
const TYPE: Record<PictureKind, string> = { moment: STORY_TYPE, qr: QR_TYPE, card: STORY_TYPE };

async function allowed(deps: StoryDeps, userId: number, kind: PictureKind) {
  if (kind === 'moment') return (await deps.store.offered(userId)).length > 0;
  return (await deps.store.approvedAt(userId)) !== null;
}

// A picture the Mini App drew, kept a day under a new id (docs/123, docs/117): Telegram reads it for a
// story or a download. The public link holds no other picture.
export async function savePicture(
  deps: StoryDeps,
  userId: number,
  kind: PictureKind,
  image: { readonly body: ArrayBuffer; readonly type: string },
): Promise<Saved> {
  if (!(await allowed(deps, userId, kind))) return { ok: false, error: 'growth.not_found' };
  const size = image.body.byteLength;
  if (image.type !== TYPE[kind] || size === 0 || size > MAX_STORY_BYTES) {
    return { ok: false, error: 'growth.invalid_image' };
  }
  const id = deps.newId();
  await deps.stories.put(storyKey(id), image.body, image.type);
  return { ok: true, id };
}
