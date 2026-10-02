import { apiHost, type BrandConfig } from '@platform/brands';
import { LEGAL_EDITION, PUBLIC_COMPANY_PATH, type LegalDocument } from '@platform/contracts';
import { legalEdition, legalSections, legalTitle, legalValues, type I18n } from '@platform/i18n';
import { escape } from './html';

// Marks around the values the page script replaces: control characters never appear in a text.
const MARK = { company: '\u0001company\u0001', email: '\u0001email\u0001' } as const;
const MONTHS = 12;
const SAMPLE_DAY = 15;

// "{day}-oktabr" for every month: the script writes the date of an edition as legalEdition does.
const dateTemplates = ({ formatDate }: I18n) =>
  Array.from({ length: MONTHS }, (_, month) =>
    formatDate(new Date(Date.UTC(2026, month, SAMPLE_DAY, 7))).replace(String(SAMPLE_DAY), '{day}'),
  ).join('|');

// A legal document on the site, the same text as in the Mini Apps (docs/30, docs/58). The page is
// built without the requisites (the brand name, no placeholder); the script fills the requisites and
// the edition the owner saved, from the public API (G34).
export function documentPage(document: LegalDocument, brand: BrandConfig, i18n: I18n) {
  const { t } = i18n;
  const fallback = legalValues(i18n, brand, null);
  const values = { ...fallback, company: MARK.company, email: MARK.email };
  const filled = (text: string) =>
    escape(text)
      .replaceAll(MARK.company, `<span data-company>${escape(fallback.company)}</span>`)
      .replaceAll(MARK.email, `<span data-email>${escape(fallback.email)}</span>`);
  const sections = legalSections(document).map(
    (section, index) =>
      `<h2>${index + 1}. ${filled(t(section.title, values))}</h2><p>${filled(t(section.text, values))}</p>`,
  );
  const company = t('legal.company', {
    companyName: '{companyName}',
    companyForm: '{companyForm}',
    companyStir: '{companyStir}',
    companyAddress: '{companyAddress}',
  });
  const data = [
    `data-legal="https://${apiHost(brand)}${PUBLIC_COMPANY_PATH}"`,
    `data-company-template="${escape(company)}"`,
    `data-edition-template="${escape(t('legal.edition', { version: '{version}', date: '{date}' }))}"`,
    `data-dates="${escape(dateTemplates(i18n))}"`,
  ].join(' ');
  return `<div class="wrap"><article class="document" ${data}>
<h1>${escape(t(legalTitle(document)))}</h1>
<p class="edition" data-edition>${escape(legalEdition(i18n, LEGAL_EDITION))}</p>
${sections.join('\n')}
<p><a href="/">${escape(t('landing.document.home'))}</a></p>
</article></div>`;
}
