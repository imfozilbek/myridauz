import type { BrandConfig } from '@platform/brands';
import type { I18n, TranslationKey } from '@platform/i18n';
import { art } from '../art';
import { escape, telegramLink } from '../html';
import { icon, type IconName } from '../icons';
import type { RegionName } from '../map-data';
import { actions } from './hero';

type Values = Record<string, string>;

function card(name: IconName, title: string, text: string, tone = '') {
  return `<li class="card reveal"><span class="tile ${tone}">${icon(name)}</span><h3>${escape(title)}</h3><p>${escape(text)}</p></li>`;
}

const cards = (group: string, keys: readonly IconName[], { t }: I18n, values: Values, tone = '') =>
  keys
    .map((key) =>
      card(
        key,
        t(`landing.${group}.${key}.title` as TranslationKey, values),
        t(`landing.${group}.${key}.text` as TranslationKey, values),
        tone,
      ),
    )
    .join('');

// "Haydovchimisiz?": why a driver should take people along, with the real bonus and fee (docs/12).
export function driver(brand: BrandConfig, i18n: I18n) {
  const { t, formatMoney } = i18n;
  const values = {
    bonus: formatMoney(brand.promo.amount),
    percent: String(brand.commission.percent),
    minPerSeat: formatMoney(brand.commission.minPerSeat),
  };
  return `<section class="driver-side" id="driver"><div class="wrap">
<h2>${escape(t('landing.driver.title'))}</h2>
<p class="section-lead">${escape(t('landing.driver.text'))}</p>
<ul class="cards">${cards('driver', ['pitak', 'return', 'bonus'], i18n, values, 'amber')}</ul>
<a class="button driver wide" href="${telegramLink(brand.bots.driver)}">${escape(t('landing.cta.driver'))}</a>
</div></section>`;
}

export function safety(brand: BrandConfig, i18n: I18n) {
  const keys = ['checked', 'woman', 'phone', 'share', 'complaints'] as const;
  return `<section class="safety" id="safety"><div class="wrap">
<h2>${escape(i18n.t('landing.safety.title'))}</h2>
<ul class="cards five">${cards('safety', keys, i18n, { brand: brand.name })}</ul>
</div></section>`;
}

// "Hammasi Telegramda": the phone and the channels of the directions by their names in Telegram under
// their regions. A region opens in place to its channels, no JavaScript needed (owner decisions
// 13.10.2026, docs/176).
export function telegram(brand: BrandConfig, i18n: I18n, regions: readonly RegionName[]) {
  const { t } = i18n;
  const codes = [...new Set(brand.channels.map(({ code }) => code))];
  const groups = codes
    .map((code) => {
      const chips = brand.channels
        .filter((channel) => channel.code === code)
        .map(({ link, name }) => `<li><a href="${escape(link)}">${escape(name)}</a></li>`)
        .join('');
      const name = regions.find((region) => region.code === code)?.region ?? code;
      return `<details><summary><span><b class="code">${escape(code)}</b>${escape(name)}</span>${icon('open')}</summary><ul class="chips">${chips}</ul></details>`;
    })
    .join('');
  return `<section class="telegram"><div class="wrap tg-grid">
<div class="phone single">${art({ name: 'phone-telegram', alt: t('landing.telegram.title'), size: 'phone' }, { className: 'screen shown' })}</div>
<div><h2>${escape(t('landing.telegram.title'))}</h2>
<p class="section-lead">${escape(t('landing.telegram.text'))}</p>
<div class="regions">${groups}</div></div>
</div></section>`;
}

export function final(brand: BrandConfig, i18n: I18n, start?: string) {
  const { t } = i18n;
  return `<section class="final"><div class="wrap">
${art({ name: 'crowd', alt: t('landing.final.art'), size: 'crowd' }, { className: 'crowd' })}
<h2>${escape(t('landing.final.title'))}</h2>
<p class="final-slogan">${escape(brand.slogan)}</p>
${actions(brand, i18n, 'actions', start)}
</div></section>`;
}
