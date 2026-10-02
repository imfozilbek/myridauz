import { NAVIGATORS, type Navigator } from '@platform/contracts';
import { readStored, writeStored } from '../telegram/device-storage';

// The navigator of the driver (docs/70): chosen once, remembered on all their phones (docs/88 L12),
// changed any time. Apple Maps only on an iPhone.
const KEY = 'way_navigator';

export const navigatorsFor = (platform: 'ios' | 'base'): readonly Navigator[] =>
  platform === 'ios' ? NAVIGATORS : NAVIGATORS.filter((navigator) => navigator !== 'apple');

export function savedNavigator(): Navigator | null {
  const saved = readStored(KEY);
  return NAVIGATORS.find((navigator) => navigator === saved) ?? null;
}

export function saveNavigator(navigator: Navigator) {
  writeStored(KEY, navigator);
}
