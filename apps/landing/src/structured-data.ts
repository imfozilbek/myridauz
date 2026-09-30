import type { BrandConfig } from '@platform/brands';
import type { Question } from './sections/faq';

// Structured data for search engines (JSON-LD, schema.org, docs/60): who we are, the questions
// and the path of a page. "<" is escaped, so a text never closes the script tag.
const script = (data: object) =>
  `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</gu, '\\u003c')}</script>`;

export function organization(brand: BrandConfig, description: string) {
  const url = `https://${brand.domain}/`;
  return [
    script({
      '@type': 'Organization',
      name: brand.name,
      url,
      logo: `${url}apple-touch-icon.png`,
      slogan: brand.slogan,
    }),
    script({ '@type': 'WebSite', name: brand.name, url, description, inLanguage: 'uz' }),
  ].join('');
}

export const faqPage = (items: readonly Question[]) =>
  script({
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  });

export const breadcrumbs = (brand: BrandConfig, items: readonly { name: string; path: string }[]) =>
  script({
    '@type': 'BreadcrumbList',
    itemListElement: items.map(({ name, path }, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: `https://${brand.domain}${path}`,
    })),
  });
