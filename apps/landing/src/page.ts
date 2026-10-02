import type { BrandConfig } from '@platform/brands';
import { LEGAL_DOCUMENTS } from '@platform/contracts';
import type { I18n } from '@platform/i18n';
import { escape, passengerLink, telegramLink } from './html';
import { styles } from './styles';

type Page = {
  readonly brand: BrandConfig;
  readonly i18n: I18n;
  readonly year: number;
  readonly title: string;
  readonly path: string;
  readonly body: string;
  // The text of the search result and the link preview; the main description by default.
  readonly description?: string;
  // Structured data of the page (JSON-LD, docs/60).
  readonly head?: string;
  // The small script of the interactive parts, inline: one request for the whole page.
  readonly script?: string;
  // A page of a direction: the passenger bot opens the search with the route (docs/89 S4).
  readonly start?: string;
};

// The frame of every page: head with the link preview, the header with the logo, the footer
// with the documents and the contact (docs/30). CSS is inline: one request, a fast first screen.
export function page({ brand, i18n, year, title, path, body, script = '', ...more }: Page) {
  const { t } = i18n;
  const url = `https://${brand.domain}${path}`;
  const description = escape(more.description ?? t('landing.description', { brand: brand.name }));
  const documents = LEGAL_DOCUMENTS.map(
    (document) => `<a href="/${document}/">${escape(t(`legal.${document}.title`))}</a>`,
  ).join('');
  const { support } = brand.bots;
  const contact = escape(t('landing.footer.contact', { supportBot: support })).replace(
    `@${support}`,
    `<a href="${telegramLink(support)}">@${support}</a>`,
  );
  return `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${description}">
<meta name="theme-color" content="${brand.theme.colors.bg}">
<link rel="canonical" href="${url}">
<link rel="preload" href="/fonts/brand.woff2" as="font" type="font/woff2" crossorigin>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://${brand.domain}/og-image.png">
<style>${styles(brand)}</style>
${more.head ?? ''}
</head>
<body>
<header><div class="wrap"><a class="brand" href="/"><img src="/favicon.svg" alt="${escape(
    t('landing.logo', { brand: brand.name }),
  )}" width="36" height="36">${escape(brand.name)}</a>
<a class="button small" href="${passengerLink(brand.bots.passenger, more.start)}">${escape(t('landing.cta.passenger'))}</a></div></header>
<main>${body}</main>
<footer><div class="wrap">
<strong>${escape(t('landing.footer.documents'))}</strong>
<nav>${documents}</nav>
<p>${contact}</p>
<p>${escape(t('landing.footer.copyright', { year: String(year), brand: brand.name }))}</p>
</div></footer>
${script ? `<script>${script}</script>` : ''}
</body>
</html>
`;
}
