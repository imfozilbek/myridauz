import type { BrandConfig } from '@platform/brands';

// The files search engines read first (docs/60): every page of the site and where the list is.
export function searchFiles(brand: BrandConfig, paths: readonly string[]) {
  const origin = `https://${brand.domain}`;
  const urls = paths.map((path) => `<url><loc>${origin}${path}</loc></url>`).join('\n');
  return {
    'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
    'robots.txt': `User-agent: *
Allow: /
Sitemap: ${origin}/sitemap.xml
`,
  };
}
