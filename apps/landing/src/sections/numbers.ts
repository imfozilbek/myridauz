import type { BrandConfig } from '@platform/brands';
import type { I18n, TranslationKey } from '@platform/i18n';
import type { Direction } from '../directions';
import { escape } from '../html';
import type { MapData } from '../map-data';

// Minutes a driver needs to announce a trip (the steps of docs/51, checked on the promo screens).
const MINUTES_TO_PUBLISH = 1;

// "Rida in numbers" (docs/60): only true numbers, counted from the data of the brand, never users
// or trips we do not have yet. The script counts them up when they come into view.
export function numbers(brand: BrandConfig, { t }: I18n, map: MapData, all: readonly Direction[]) {
  const facts: [TranslationKey, number][] = [
    ['landing.numbers.regions', map.regions.length],
    ['landing.numbers.directions', all.length],
    ['landing.numbers.channels', brand.channels.length],
    ['landing.numbers.minute', MINUTES_TO_PUBLISH],
  ];
  const items = facts
    .map(([key, value]) => `<li><b data-count-up="${value}">${value}</b><span>${escape(t(key))}</span></li>`)
    .join('');
  return `<section class="numbers" aria-label="${escape(t('landing.numbers.title', { brand: brand.name }))}"><div class="wrap">
<ul class="number-list">${items}</ul>
</div></section>`;
}
