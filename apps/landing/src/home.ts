import type { BrandConfig } from '@platform/brands';
import type { I18n, TranslationKey } from '@platform/i18n';
import { escape, telegramLink } from './html';
import { icon, type IconName } from './icons';

const ABOUT = ['together', 'share', 'notTaxi'] as const;
const SAFETY = ['checked', 'woman', 'phone', 'complaints'] as const;
const STEPS = [1, 2, 3] as const;
const ROLES = ['passenger', 'driver'] as const;

// Two ways in, both lead to Telegram: the passenger bot and the driver bot (docs/02).
function actions({ bots }: BrandConfig, { t }: I18n) {
  return `<div class="actions">
<a class="button" href="${telegramLink(bots.passenger)}">${escape(t('landing.cta.passenger'))}</a>
<a class="button driver" href="${telegramLink(bots.driver)}">${escape(t('landing.cta.driver'))}</a>
</div>`;
}

function card(name: IconName, title: string, text: string) {
  return `<div class="card"><span class="tile">${icon(name)}</span><h3>${escape(title)}</h3><p>${escape(text)}</p></div>`;
}

function how({ t }: I18n) {
  const roles = ROLES.map((role) => {
    const steps = STEPS.map(
      (step) => `<li>${escape(t(`landing.how.${role}.${step}` as TranslationKey))}</li>`,
    );
    const tile = role === 'driver' ? 'tile driver' : 'tile';
    return `<div class="card"><div class="card-head"><span class="${tile}">${icon(role)}</span>
<h3>${escape(t(`landing.how.${role}`))}</h3></div><ol class="steps">${steps.join('')}</ol></div>`;
  });
  return `<section><div class="wrap"><h2>${escape(t('landing.how.title'))}</h2>
<div class="cards two">${roles.join('')}</div></div></section>`;
}

// The main page (G15): what the brand is, how it works for both sides, what keeps people safe.
export function home(brand: BrandConfig, i18n: I18n) {
  const { t } = i18n;
  const values = { brand: brand.name };
  const about = ABOUT.map((key) =>
    card(key, t(`landing.about.${key}.title`), t(`landing.about.${key}.text`, values)),
  );
  const safety = SAFETY.map((key) =>
    card(key, t(`landing.safety.${key}.title`), t(`landing.safety.${key}.text`, values)),
  );
  return `<div class="hero"><div class="wrap">
<span class="slogan">${escape(brand.slogan)}</span>
<h1>${escape(t('landing.hero.title'))}</h1>
<p class="lead">${escape(t('landing.hero.text'))}</p>
${actions(brand, i18n)}
<p class="hint">${escape(t('landing.cta.hint'))}</p>
</div></div>
<section><div class="wrap"><h2>${escape(t('landing.about.title', values))}</h2>
<div class="cards">${about.join('')}</div></div></section>
${how(i18n)}
<section><div class="wrap"><h2>${escape(t('landing.safety.title'))}</h2>
<div class="cards four">${safety.join('')}</div></div></section>
<div class="final"><div class="wrap"><h2>${escape(brand.slogan)}</h2>${actions(brand, i18n)}</div></div>`;
}
