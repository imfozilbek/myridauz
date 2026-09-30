import type { I18n } from '@platform/i18n';
import type { Direction } from '../directions';
import { escape } from '../html';

// Inside a group the capital is in the title, so a link shows the other city only.
const link = (item: Direction, other: 'from' | 'to', current?: Direction) =>
  `<li><a href="${item.path}"${current?.path === item.path ? ' aria-current="page"' : ''}>${escape(item[other].name)}</a></li>`;

// "Yoʻnalishlar": every direction by its own page, from the capital and back (docs/60).
// Search engines find the pages by these links; a person finds the route in one tap.
export function directionsSection(all: readonly Direction[], { t }: I18n, current?: Direction) {
  const hub = all[0]?.from;
  if (!hub) return '';
  const group = (title: string, other: 'from' | 'to') =>
    `<div><h3>${escape(title)}</h3><ul class="direction-list">${all
      .filter((item) => item[other] !== hub)
      .map((item) => link(item, other, current))
      .join('')}</ul></div>`;
  return `<section class="directions" id="directions"><div class="wrap">
<h2>${escape(t('landing.directions.title'))}</h2>
<p class="section-lead">${escape(t('landing.directions.text', { city: hub.name }))}</p>
<div class="direction-groups">
${group(t('landing.directions.from', { city: hub.name }), 'to')}
${group(t('landing.directions.to', { city: hub.name }), 'from')}
</div>
</div></section>`;
}
