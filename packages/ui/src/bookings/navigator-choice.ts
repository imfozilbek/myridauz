import { NAVIGATORS, type Navigator } from '@platform/contracts';

// The navigator of the driver (docs/70): chosen once, remembered on this phone, changed any time.
// Apple Maps only on an iPhone. No storage (a private window): the driver chooses each time.
const KEY = 'way.navigator';

export const navigatorsFor = (platform: 'ios' | 'base'): readonly Navigator[] =>
  platform === 'ios' ? NAVIGATORS : NAVIGATORS.filter((navigator) => navigator !== 'apple');

export function savedNavigator(): Navigator | null {
  try {
    const saved = localStorage.getItem(KEY);
    return NAVIGATORS.find((navigator) => navigator === saved) ?? null;
  } catch {
    return null;
  }
}

export function saveNavigator(navigator: Navigator) {
  try {
    localStorage.setItem(KEY, navigator);
  } catch {
    // No storage: the driver chooses again next time.
  }
}
