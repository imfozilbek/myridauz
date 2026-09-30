import type { BrandConfig } from '@platform/brands';
import type { I18n } from '@platform/i18n';
import { escape, telegramLink } from '../html';
import { icon } from '../icons';
import type { Route } from '../map-data';

// The card next to the map: the route, the distance, the price for one seat and for a full car,
// the channel of the region, and the button into the bot with the route.
export function routeCard(brand: BrandConfig, i18n: I18n, route: Route) {
  const { t } = i18n;
  const start = `${telegramLink(brand.bots.passenger)}?startapp=find_${route.from}_${route.to}`;
  return `<div class="map-card" aria-live="polite">
<p class="route-name">${icon('place')}<span data-name="from"></span><span class="arrow">→</span><b data-name="to"></b></p>
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
<a class="button" data-go href="${start}">${escape(t('landing.map.go'))}</a>
<small class="go-hint">${escape(t('landing.map.goHint', { brand: brand.name }))}</small>
<a class="channel" data-channel-link href="${telegramLink(brand.channels[route.to] ?? brand.channels[route.from] ?? brand.bots.passenger)}">${icon('telegram')}<span>${escape(t('landing.map.channel'))}</span></a>
</div>`;
}
