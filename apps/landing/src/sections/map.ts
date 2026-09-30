import { apiHost, type BrandConfig } from '@platform/brands';
import { PUBLIC_PRICE_PATH } from '@platform/contracts';
import type { I18n } from '@platform/i18n';
import { escape, telegramLink } from '../html';
import { icon } from '../icons';
import { FIRST_ROUTE, type MapData } from '../map-data';
import { routeCard } from './route-card';

type Side = keyof typeof FIRST_ROUTE;

// A list of the region centers; every option carries what the script needs (place, point, channel).
function select(side: Side, map: MapData, brand: BrandConfig, label: string) {
  const options = map.cities.map((city) => {
    const channel = brand.channels[city.soato];
    const data = `data-place="${city.place}" data-x="${city.x}" data-y="${city.y}"${channel ? ` data-channel="${escape(channel)}"` : ''}`;
    const selected = city.soato === FIRST_ROUTE[side] ? ' selected' : '';
    return `<option value="${city.soato}" ${data}${selected}>${escape(city.name)}</option>`;
  });
  return `<label class="place-select"><span>${escape(label)}</span><select data-side="${side}">${options.join('')}</select></label>`;
}

const regions = (map: MapData) =>
  map.regions
    .map(({ soato, d }) => {
      const role = soato === FIRST_ROUTE.from ? ' from' : soato === FIRST_ROUTE.to ? ' to' : '';
      return `<path class="region${role}" d="${d}" data-region="${soato}"/>`;
    })
    .join('');

// "Qayerga borasiz?": "from" and "to", the road on the map, the distance and the live price of the
// public API (the same recommendation as in the Mini Apps). The button opens the passenger bot with
// that route: after the registration the search opens with it (startapp=find_<from>_<to>).
export function mapSection(map: MapData, brand: BrandConfig, i18n: I18n) {
  const { t, formatNumber } = i18n;
  const templates = [
    `data-api="https://${apiHost(brand)}${PUBLIC_PRICE_PATH}"`,
    `data-bot="${telegramLink(brand.bots.passenger)}"`,
    `data-money="${escape(t('common.money', { amount: '{amount}' }))}"`,
    `data-km="${escape(t('market.trip.km', { km: '{km}' }))}"`,
    `data-approx="${escape(t('landing.map.approx', { value: '{value}' }))}"`,
    `data-seats="${escape(t('landing.map.seats', { count: '{count}' }))}"`,
    `data-thousands="${escape(formatNumber(1000).replace(/\d/gu, ''))}"`,
  ].join(' ');
  const dots = map.cities
    .map((city) => `<circle class="city-dot" cx="${city.x}" cy="${city.y}" r="5"/>`)
    .join('');
  return `<section class="map" id="map" data-map ${templates}><div class="wrap">
<h2>${escape(t('landing.map.title'))}</h2>
<p class="section-lead">${escape(t('landing.map.text'))}</p>
<div class="route-form">
${select('from', map, brand, t('places.from'))}
<button type="button" class="swap" data-swap aria-label="${escape(t('landing.map.swap'))}">${icon('swap')}</button>
${select('to', map, brand, t('places.to'))}
</div>
<div class="map-grid">
<svg class="uz" viewBox="0 0 ${map.width} ${map.height}" aria-label="${escape(t('landing.map.pick'))}">
${regions(map)}${dots}
<path class="route-line" d="" data-route/>
<circle class="origin-dot" r="10" data-point="from"/><circle class="target-dot" r="10" data-point="to"/>
</svg>
${routeCard(brand, i18n)}
</div>
</div></section>`;
}
