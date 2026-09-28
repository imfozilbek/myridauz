import { cloudflare } from './cloudflare.mjs';

// Creates the Pages project once, then keeps its custom domain and DNS record in place.
export async function ensurePagesProject(project) {
  const existing = await cloudflare('GET', `/accounts/:account/pages/projects/${project}`);
  if (!existing)
    await cloudflare('POST', '/accounts/:account/pages/projects', {
      name: project,
      production_branch: 'main',
    });
}

export async function ensurePagesDomain(project, host, zoneName) {
  const domains = await cloudflare('GET', `/accounts/:account/pages/projects/${project}/domains`);
  if (!domains.some((domain) => domain.name === host)) {
    await cloudflare('POST', `/accounts/:account/pages/projects/${project}/domains`, { name: host });
  }
  const [zone] = await cloudflare('GET', `/zones?name=${zoneName}`);
  const records = await cloudflare('GET', `/zones/${zone.id}/dns_records?name=${host}`);
  if (records.length === 0) {
    const record = { type: 'CNAME', name: host, content: `${project}.pages.dev`, proxied: true };
    await cloudflare('POST', `/zones/${zone.id}/dns_records`, record);
  }
}
