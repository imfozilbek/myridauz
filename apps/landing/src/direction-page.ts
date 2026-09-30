import type { BrandConfig } from '@platform/brands';
import type { I18n } from '@platform/i18n';
import type { Direction } from './directions';
import { escape } from './html';
import type { MapData } from './map-data';
import { final, safety } from './sections/cards';
import { directionsSection } from './sections/directions';
import { faq, questions, type Question } from './sections/faq';
import { actions } from './sections/hero';
import { how } from './sections/how';
import { mapSection } from './sections/map';

const DIRECTION_QUESTIONS = ['price', 'find', 'none'] as const;

// The questions of one direction first, then the general ones about trust.
export function directionQuestions(brand: BrandConfig, i18n: I18n, { from, to }: Direction): Question[] {
  const values = { from: from.name, to: to.name, brand: brand.name };
  const own = DIRECTION_QUESTIONS.map((key) => ({
    q: i18n.t(`landing.direction.faq.${key}.q`, values),
    a: i18n.t(`landing.direction.faq.${key}.a`, values),
  }));
  return [...own, ...questions(brand, i18n).slice(0, 3)];
}

// A page of one direction (docs/60): the route is already chosen on the map, the button opens
// the bot with it, and the other directions are one tap away.
export function directionPage(
  brand: BrandConfig,
  i18n: I18n,
  {
    map,
    all,
    current,
    items,
  }: { map: MapData; all: readonly Direction[]; current: Direction; items: readonly Question[] },
) {
  const { t } = i18n;
  const values = { from: current.from.name, to: current.to.name, brand: brand.name };
  return [
    `<section class="hero direction-hero"><div class="wrap narrow">
<nav class="crumbs"><a href="/">${escape(t('landing.document.home'))}</a><span>/</span><a href="/#directions">${escape(t('landing.directions.title'))}</a></nav>
<span class="slogan">${escape(brand.slogan)}</span>
<h1>${escape(t('landing.direction.title', values))}</h1>
<p class="lead">${escape(t('landing.direction.text', values))}</p>
${actions(brand, i18n)}
<p class="hint">${escape(t('landing.cta.hint'))}</p>
</div></section>`,
    mapSection(map, brand, i18n, { from: current.from.soato, to: current.to.soato }),
    how(brand, i18n),
    safety(brand, i18n),
    faq(items, i18n),
    directionsSection(all, i18n, current),
    final(brand, i18n),
    `<div class="sticky" data-sticky>${actions(brand, i18n, 'actions compact')}</div>`,
  ].join('\n');
}
