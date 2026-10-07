import { channelOf, type BrandConfig } from '@platform/brands';
import type { I18n } from '@platform/i18n';
import type { Direction } from './directions';
import { escape, telegramLink } from './html';
import { icon } from './icons';
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

// The search of the Mini App with this route (docs/89 S4): every passenger button of the page.
export const startOf = ({ from, to }: Direction) => `find_${from.soato}_${to.soato}`;

// The channel of the direction under the buttons (docs/119): the new trips of its zone in Telegram.
function channelButton(brand: BrandConfig, { t }: I18n, { from, to }: Direction) {
  const channel = channelOf(brand, to.place, to.soato) ?? channelOf(brand, from.place, from.soato);
  if (!channel) return '';
  const text = t('landing.direction.channel', { brand: brand.name, zone: channel.title });
  return `<a class="button channel-button" href="${telegramLink(channel.username)}">${icon('telegram')}<span>${escape(text)}</span></a>`;
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
  const start = startOf(current);
  return [
    `<section class="hero direction-hero"><div class="wrap narrow">
<nav class="crumbs"><a href="/">${escape(t('landing.document.home'))}</a><span>/</span><a href="/#directions">${escape(t('landing.directions.title'))}</a></nav>
<span class="slogan">${escape(brand.slogan)}</span>
<h1>${escape(t('landing.direction.title', values))}</h1>
<p class="lead">${escape(t('landing.direction.text', values))}</p>
${actions(brand, i18n, 'actions', start)}
${channelButton(brand, i18n, current)}
<p class="hint">${escape(t('landing.cta.hint'))}</p>
</div></section>`,
    mapSection(map, brand, i18n, { from: current.from.soato, to: current.to.soato }),
    how(brand, i18n),
    safety(brand, i18n),
    faq(items, i18n),
    directionsSection(all, i18n, current),
    final(brand, i18n, start),
    `<div class="sticky" data-sticky>${actions(brand, i18n, 'actions compact', start)}</div>`,
  ].join('\n');
}
