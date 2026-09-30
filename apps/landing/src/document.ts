import type { BrandConfig } from '@platform/brands';
import { LEGAL_EDITION, type LegalDocument } from '@platform/contracts';
import { legalEdition, legalSections, legalTitle, legalValues, type I18n } from '@platform/i18n';
import { escape } from './html';

// A legal document on the site, the same text as in the Mini Apps (docs/30, docs/58).
export function documentPage(document: LegalDocument, brand: BrandConfig, i18n: I18n) {
  const { t } = i18n;
  const values = legalValues(i18n, brand);
  const sections = legalSections(document).map(
    (section, index) =>
      `<h2>${index + 1}. ${escape(t(section.title, values))}</h2><p>${escape(t(section.text, values))}</p>`,
  );
  return `<div class="wrap"><article class="document">
<h1>${escape(t(legalTitle(document)))}</h1>
<p class="edition">${escape(legalEdition(i18n, LEGAL_EDITION))}</p>
${sections.join('\n')}
<p><a href="/">${escape(t('landing.document.home'))}</a></p>
</article></div>`;
}
