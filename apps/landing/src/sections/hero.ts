import type { BrandConfig } from '@platform/brands';
import type { I18n } from '@platform/i18n';
import { art } from '../art';
import { escape, passengerLink, telegramLink } from '../html';
import { icon, type IconName } from '../icons';
import type { HeroRoads } from '../map-data';
import { heroLive } from './hero-live';

const FACTS = ['checked', 'phone', 'telegram'] as const satisfies readonly IconName[];

// Two ways in, both lead to Telegram: the passenger bot and the driver bot (docs/02).
export function actions({ bots }: BrandConfig, { t }: I18n, className = 'actions', start?: string) {
  return `<div class="${className}">
<a class="button" href="${passengerLink(bots.passenger, start)}">${escape(t('landing.cta.passenger'))}</a>
<a class="button driver" href="${telegramLink(bots.driver)}">${escape(t('landing.cta.driver'))}</a>
</div>`;
}

// The first screen: what it is in one line, the two buttons and the whole country on the move.
export function hero(brand: BrandConfig, i18n: I18n, roads: HeroRoads) {
  const { t } = i18n;
  const facts = FACTS.map((key) => `<li>${icon(key)}${escape(t(`landing.hero.${key}`))}</li>`).join('');
  return `<section class="hero" id="top"><div class="wrap hero-grid">
<div class="hero-copy">
<span class="slogan">${escape(brand.slogan)}</span>
<h1>${escape(t('landing.hero.title'))}</h1>
<p class="lead">${escape(t('landing.hero.text'))}</p>
${actions(brand, i18n)}
<p class="hint">${escape(t('landing.cta.hint'))}</p>
</div>
<div class="hero-art">${art({ name: 'hero-map', alt: t('landing.hero.art'), size: 'hero' }, { eager: true })}${heroLive(roads)}</div>
</div>
<ul class="facts wrap">${facts}</ul>
</section>`;
}
