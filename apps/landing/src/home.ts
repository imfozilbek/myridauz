import type { BrandConfig } from '@platform/brands';
import type { I18n } from '@platform/i18n';
import type { ChannelTitles, MapData } from './map-data';
import { driver, final, safety, telegram } from './sections/cards';
import { faq } from './sections/faq';
import { actions, hero } from './sections/hero';
import { how } from './sections/how';
import { mapSection } from './sections/map';
import { pains } from './sections/pains';

// The main page (G15, docs/59): from "what is it" to the two buttons, in the order a person asks.
export function home(brand: BrandConfig, i18n: I18n, map: MapData, channels: ChannelTitles) {
  return [
    hero(brand, i18n),
    pains(brand, i18n),
    how(brand, i18n),
    mapSection(map, brand, i18n),
    driver(brand, i18n),
    safety(brand, i18n),
    telegram(brand, i18n, channels),
    faq(brand, i18n),
    final(brand, i18n),
    // On a phone the two buttons stay at hand after the first screen.
    `<div class="sticky" data-sticky>${actions(brand, i18n, 'actions compact')}</div>`,
  ].join('\n');
}
