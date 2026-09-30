import type { BrandConfig } from '@platform/brands';
import type { I18n, TranslationKey } from '@platform/i18n';
import { escape } from '../html';
import { icon } from '../icons';

const QUESTIONS = ['taxi', 'price', 'check', 'phone', 'app', 'fee', 'help'] as const;

// Answers open in place (details): no JavaScript needed, readable by search engines.
export function faq(brand: BrandConfig, { t, formatMoney }: I18n) {
  const values = {
    brand: brand.name,
    adminBot: brand.bots.admin,
    bonus: formatMoney(brand.promo.amount),
    percent: String(brand.commission.percent),
    minPerSeat: formatMoney(brand.commission.minPerSeat),
  };
  const items = QUESTIONS.map((key) => {
    const text = (part: 'q' | 'a') => escape(t(`landing.faq.${key}.${part}` as TranslationKey, values));
    return `<details class="reveal"><summary>${text('q')}${icon('open')}</summary><p>${text('a')}</p></details>`;
  }).join('');
  return `<section class="faq" id="faq"><div class="wrap narrow">
<h2>${escape(t('landing.faq.title'))}</h2>${items}
</div></section>`;
}
