import type { BrandConfig } from '@platform/brands';
import type { I18n, TranslationKey } from '@platform/i18n';
import { escape } from '../html';
import { icon } from '../icons';

// A question and its answer as plain text: the page shows them and search engines read them (FAQPage).
export type Question = { readonly q: string; readonly a: string };

const QUESTIONS = ['taxi', 'price', 'check', 'phone', 'app', 'fee', 'help'] as const;

export function questions(brand: BrandConfig, { t, formatMoney }: I18n): Question[] {
  const values = {
    brand: brand.name,
    supportBot: brand.bots.support,
    bonus: formatMoney(brand.promo.amount),
    percent: String(brand.commission.percent),
    minPerSeat: formatMoney(brand.commission.minPerSeat),
  };
  return QUESTIONS.map((key) => ({
    q: t(`landing.faq.${key}.q` as TranslationKey, values),
    a: t(`landing.faq.${key}.a` as TranslationKey, values),
  }));
}

// Answers open in place (details): no JavaScript needed, readable by search engines.
export function faq(items: readonly Question[], { t }: I18n) {
  const list = items
    .map(
      ({ q, a }) =>
        `<details class="reveal"><summary>${escape(q)}${icon('open')}</summary><p>${escape(a)}</p></details>`,
    )
    .join('');
  return `<section class="faq" id="faq"><div class="wrap narrow">
<h2>${escape(t('landing.faq.title'))}</h2>${list}
</div></section>`;
}
