import type { Bindings } from '../../env';
import { createMemoryImages } from './memory-images';
import { r2Images } from './r2-images';

const localStories = createMemoryImages();

// The pictures of Telegram stories: of a trip and of a moment «Men Rida bilan» (G69, docs/123).
// The rule stories-1-day of R2 deletes them after a day (docs/117).
export const storiesOf = (env: Bindings) => (env.MEDIA ? r2Images(env.MEDIA) : localStories);
