import type { BrandConfig } from '@platform/brands';
import type { I18n, TranslationKey } from '@platform/i18n';
import { art } from '../art';
import { escape } from '../html';
import { icon } from '../icons';

// Each step shows its screen of the Mini App (the pictures of the promo video, docs/41).
const PATHS = {
  passenger: ['phone-search', 'phone-results', 'phone-trip', 'phone-chat'],
  driver: ['phone-publish', 'phone-telegram', 'phone-requests'],
} as const;
type Role = keyof typeof PATHS;

function path(role: Role, brand: BrandConfig, { t }: I18n, active: boolean) {
  const values = { brand: brand.name };
  const steps = PATHS[role].map((screen, index) => {
    const key = (part: string) => `landing.how.${role}.${index + 1}.${part}` as TranslationKey;
    const title = t(key('title'));
    return `<li class="step${index === 0 ? ' active' : ''}" data-step="${index}">
<button type="button" data-screen="${screen}"><b>${escape(title)}</b><span>${escape(t(key('text'), values))}</span></button>
</li>`;
  });
  const phones = PATHS[role].map((screen, index) =>
    art(
      {
        name: screen,
        alt: t('landing.how.phone', {
          brand: brand.name,
          step: t(`landing.how.${role}.${index + 1}.title` as TranslationKey),
        }),
        size: 'phone',
      },
      { className: index === 0 ? 'screen shown' : 'screen' },
    ),
  );
  return `<div class="path${active ? ' shown' : ''}" data-path="${role}">
<div class="phone">${phones.join('')}</div>
<ol class="steps">${steps.join('')}</ol>
</div>`;
}

// "Qanday ishlaydi": two tabs, the steps of each side and the phone that follows the steps.
export function how(brand: BrandConfig, i18n: I18n) {
  const { t } = i18n;
  const tabs = (Object.keys(PATHS) as Role[]).map(
    (role, index) =>
      `<button type="button" role="tab" data-tab="${role}" aria-selected="${index === 0}">${icon(role)}${escape(t(`landing.how.${role}`))}</button>`,
  );
  return `<section class="how" id="how" data-how><div class="wrap">
<h2>${escape(t('landing.how.title'))}</h2>
<div class="tabs" role="tablist">${tabs.join('')}</div>
${path('passenger', brand, i18n, true)}${path('driver', brand, i18n, false)}
</div></section>`;
}
