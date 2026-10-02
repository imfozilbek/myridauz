import legal from '../locales/uz-Latn/legal.json' with { type: 'json' };
import type { I18n } from './create-i18n';
import type { TranslationKey } from './messages';

// What the legal texts take from a brand config (docs/30): the Mini Apps and the landing use it.
export type LegalBrand = {
  readonly name: string;
  readonly bots: { readonly support: string };
  readonly company: {
    readonly legalName: string;
    readonly form: string;
    readonly stir: string;
    readonly address: string;
  };
  readonly commission: { readonly percent: number; readonly minPerSeat: number };
  readonly promo: {
    readonly amount: number;
    readonly grants: number;
    readonly days: number;
    readonly windowDays: number;
  };
};

type Section = { readonly title: TranslationKey; readonly text: TranslationKey };

const SECTION_TITLE = /^(\w+)\.\d+\.title$/u;

// The sections of a document follow legal.json: "<document>.<n>.title" and "<document>.<n>.text".
export function legalSections(document: string): Section[] {
  return Object.keys(legal)
    .filter((key) => SECTION_TITLE.exec(key)?.[1] === document)
    .map((key) => ({
      title: `legal.${key}` as TranslationKey,
      text: `legal.${key.replace(/title$/u, 'text')}` as TranslationKey,
    }));
}

export const legalTitle = (document: string) => `legal.${document}.title` as TranslationKey;

// The numbers and names in the texts come from the brand config, never from the texts (docs/22).
export function legalValues({ t, formatMoney }: I18n, brand: LegalBrand) {
  const { company, commission, promo } = brand;
  return {
    brand: brand.name,
    company: t('legal.company', {
      companyName: company.legalName,
      companyForm: company.form,
      companyStir: company.stir,
      companyAddress: company.address,
    }),
    supportBot: brand.bots.support,
    percent: String(commission.percent),
    minPerSeat: formatMoney(commission.minPerSeat),
    bonus: formatMoney(promo.amount),
    grants: String(promo.grants),
    days: String(promo.days),
    windowDays: String(promo.windowDays),
  };
}

// "Tahrir 1.0, 30-sentabr 2026": the edition under the title of every document.
export function legalEdition({ t, formatDate }: I18n, edition: { version: string; date: string }) {
  const date = formatDate(new Date(`${edition.date}T12:00:00+05:00`));
  return t('legal.edition', { version: edition.version, date: `${date} ${edition.date.slice(0, 4)}` });
}
