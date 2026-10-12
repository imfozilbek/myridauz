import type { HomeGo } from '../../flow/start-action';
import type { useDockEnds } from '../dock-ends';
import { DOCK_FROM } from '../dock-sections';
import { useHomeTap } from '../use-home-tap';

// The tools of the ends of a free block, of both roles (G79 В4, owner 12.10.2026): the «x» of a
// filled end, «Joylashuvim» of an empty «Qayerdan»; the place unknown, the list of «Qayerdan».
export function useEndTools(ends: ReturnType<typeof useDockEnds>, go: HomeGo) {
  const tap = useHomeTap();
  return {
    from: {
      onClear: tap('dock_from_clear', ends.clearFrom),
      onLocate: tap('dock_from_locate', () => {
        void ends.locate().then((found) => {
          if (!found) go(DOCK_FROM);
        });
      }),
    },
    to: { onClear: tap('dock_to_clear', ends.clearTo) },
  };
}
