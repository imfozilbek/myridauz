import type { BrandConfig } from '@platform/brands';
import type { I18n } from '@platform/i18n';
import { escape } from '../html';
import { icon } from '../icons';

const PAINS = ['wait', 'price', 'stranger', 'woman', 'empty'] as const;

// "Tanish holatmi?": the old way and the new way of the same trip. The switch shows one side;
// without JavaScript both sides stay visible (docs/59).
export function pains(brand: BrandConfig, { t }: I18n) {
  const values = { brand: brand.name };
  const cards = PAINS.map(
    (key) => `<li class="pain reveal"><span class="tile soft">${icon(key)}</span>
<p class="before">${escape(t(`landing.pains.${key}.before`))}</p>
<p class="after">${escape(t(`landing.pains.${key}.after`))}</p></li>`,
  ).join('');
  return `<section class="pains" data-pains data-side="both"><div class="wrap">
<h2>${escape(t('landing.pains.title'))}</h2>
<div class="switch" role="group">
<button type="button" data-side-to="before" aria-pressed="false">${escape(t('landing.pains.before'))}</button>
<button type="button" data-side-to="after" aria-pressed="false">${escape(t('landing.pains.after', values))}</button>
</div>
<ul class="pain-list">${cards}</ul>
</div></section>`;
}
