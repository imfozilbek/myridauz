import { apiHost, type BrandConfig } from '@platform/brands';
import { PUBLIC_DIRECTIONS_PATH } from '@platform/contracts';
import type { I18n } from '@platform/i18n';
import { escape, telegramLink } from '../html';
import { icon } from '../icons';
import { FIRST_REGION, ORIGIN, type MapData } from '../map-data';
import { actions } from './hero';

// Every region is a button; its center, name and channel travel in data attributes.
function regions(map: MapData, brand: BrandConfig) {
  return map.regions
    .map(({ soato, d }) => {
      const city = map.cities.find((item) => item.soato === soato);
      if (!city || soato === ORIGIN) return `<path class="region origin" d="${d}"/>`;
      const channel = brand.channels[soato];
      const link = channel ? ` data-channel="${escape(channel)}"` : '';
      const selected = soato === FIRST_REGION ? ' selected' : '';
      const region = `<path class="region${selected}" d="${d}" role="button" tabindex="0" aria-label="${escape(city.name)}" data-region="${soato}" data-name="${escape(city.name)}" data-x="${city.x}" data-y="${city.y}"${link}/>`;
      return `${region}<circle class="city-dot" cx="${city.x}" cy="${city.y}" r="5"/>`;
    })
    .join('');
}

// "Qayerga borasiz?": the map of the regions, the distance and the live price of the direction
// from the public API (the same recommendation as in the Mini Apps), and the region channel.
export function mapSection(map: MapData, brand: BrandConfig, i18n: I18n) {
  const { t, formatNumber } = i18n;
  const origin = map.cities.find((city) => city.soato === ORIGIN);
  const first = map.cities.find((city) => city.soato === FIRST_REGION);
  const templates = [
    `data-api="https://${apiHost(brand)}${PUBLIC_DIRECTIONS_PATH}"`,
    `data-money="${escape(t('common.money', { amount: '{amount}' }))}"`,
    `data-km="${escape(t('market.trip.km', { km: '{km}' }))}"`,
    `data-approx="${escape(t('landing.map.approx', { value: '{value}' }))}"`,
    `data-seats="${escape(t('landing.map.seats', { count: '{count}' }))}"`,
    `data-thousands="${escape(formatNumber(1000).replace(/\d/gu, ''))}"`,
  ].join(' ');
  const originDot = origin ? `<circle class="origin-dot" cx="${origin.x}" cy="${origin.y}" r="9"/>` : '';
  return `<section class="map" id="map" data-map ${templates}><div class="wrap">
<h2>${escape(t('landing.map.title'))}</h2>
<p class="section-lead">${escape(t('landing.map.text'))}</p>
<div class="map-grid">
<svg class="uz" viewBox="0 0 ${map.width} ${map.height}" aria-label="${escape(t('landing.map.pick'))}">
${regions(map, brand)}
<path class="route-line" d="" data-route/>
${originDot}<circle class="target-dot" r="9" cx="${first?.x ?? 0}" cy="${first?.y ?? 0}" data-target/>
</svg>
<div class="map-card" aria-live="polite">
<p class="route-name">${icon('place')}<span>${escape(t('landing.map.from'))}</span><span class="arrow">→</span><b data-to>${escape(first?.name ?? '')}</b></p>
<p class="km" data-km-value></p>
<div class="price-row" data-price-row hidden>
<span>${escape(t('landing.map.price'))}</span><strong data-price></strong>
<small>${escape(t('landing.map.priceHint'))}</small>
</div>
<div class="seats-row" data-seats-row hidden>
<span data-seats-label></span>
<div class="stepper"><button type="button" data-less aria-label="${escape(t('landing.map.less'))}">${icon('less')}</button>
<output data-count>3</output>
<button type="button" data-more aria-label="${escape(t('landing.map.more'))}">${icon('more')}</button></div>
<strong data-total></strong>
</div>
<a class="channel" data-channel-link href="${telegramLink(brand.channels[FIRST_REGION] ?? brand.bots.passenger)}">${icon('telegram')}<span>${escape(t('landing.map.channel'))}</span></a>
${actions(brand, i18n)}
</div>
</div>
</div></section>`;
}
