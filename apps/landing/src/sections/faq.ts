import type { BrandConfig } from '@platform/brands';
import { helpValues, type HelpQuestion } from '@platform/contracts';
import type { I18n } from '@platform/i18n';
import { escape } from '../html';
import { icon } from '../icons';

// A question and its answer as plain text: the page shows them and search engines read them (FAQPage).
export type Question = { readonly q: string; readonly a: string };

// The questions of the site come from the help of the bots and the Mini Apps (G97, docs/226): one
// text everywhere. «Muammo boʻlsa, kimga yozaman?» is the site's own: in the apps it is a button.
const QUESTIONS: readonly HelpQuestion[] = [
  'find.taxi',
  'find.price',
  'driver.check',
  'account.phone',
  'account.app',
  'wallet.fee',
];

export function questions(brand: BrandConfig, { t, formatMoney }: I18n): Question[] {
  const values = helpValues(brand, formatMoney);
  return [
    ...QUESTIONS.map((key) => ({ q: t(`help.${key}.q`, values), a: t(`help.${key}.a`, values) })),
    { q: t('landing.faq.help.q', values), a: t('landing.faq.help.a', values) },
  ];
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
