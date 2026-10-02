import legal from '../locales/uz-Latn/legal.json' with { type: 'json' };
import type { I18n } from './create-i18n';
import type { TranslationKey } from './messages';

// What the legal texts take from a brand config (docs/30): the Mini Apps and the landing use it.
export type LegalBrand = {
  readonly name: string;
  readonly bots: { readonly support: string };
  // The address for questions until the owner enters the requisites (docs/30).
  readonly company: { readonly email: string };
  readonly commission: { readonly percent: number; readonly minPerSeat: number };
  readonly promo: {
    readonly amount: number;
    readonly grants: number;
    readonly days: number;
    readonly windowDays: number;
  };
};

// The requisites the owner enters in the admin Mini App (G34): the same fields as Company of contracts.
export type LegalRequisites = {
  readonly legalName: string;
  readonly form: string;
  readonly stir: string;
  readonly address: string;
  readonly email: string;
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

// "Rida (MChJ, STIR 123456789, manzil: …)": the company in the texts and in the admin preview.
export const legalCompany = ({ t }: I18n, requisites: LegalRequisites) =>
  t('legal.company', {
    companyName: requisites.legalName,
    companyForm: requisites.form,
    companyStir: requisites.stir,
    companyAddress: requisites.address,
  });

// The numbers and names in the texts come from the brand config, never from the texts (docs/22);
// the requisites come from the database (G34). Until the owner enters them (null) the texts name
// the brand and give the email of the brand config: a person never sees a placeholder.
export function legalValues(i18n: I18n, brand: LegalBrand, requisites: LegalRequisites | null) {
  const { formatMoney } = i18n;
  const { commission, promo } = brand;
  return {
    brand: brand.name,
    company: requisites ? legalCompany(i18n, requisites) : brand.name,
    supportBot: brand.bots.support,
    email: requisites?.email ?? brand.company.email,
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
