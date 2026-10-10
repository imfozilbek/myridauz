import type { DirectoryState } from '../../places/use-directory';
import { HomeFailed } from '../home-state';

type Props = {
  readonly load: { readonly failed: boolean; readonly reload: () => void };
  readonly places: DirectoryState;
  readonly retryPlaces: () => void;
};

// The lists or the places did not load (docs/65 B1): one tap tries again above the free block,
// whose buttons still work; nothing of the person is told wrong meanwhile.
export function DockFailed({ load, places, retryPlaces }: Props) {
  const placesFailed = places.status === 'error';
  if (!load.failed && !placesFailed) return null;
  const retry = () => {
    if (load.failed) load.reload();
    if (placesFailed) retryPlaces();
  };
  return <HomeFailed onRetry={retry} />;
}
