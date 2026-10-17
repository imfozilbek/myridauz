import { cloudflare } from './cloudflare.mjs';

// Creates the Pages project once and gives the address Cloudflare gave it: <project>.pages.dev, or that
// name with a suffix when another account already holds it (the other environment of the brand).
export async function ensurePagesProject(project) {
  const existing = await cloudflare('GET', `/accounts/:account/pages/projects/${project}`);
  const made =
    existing ??
    (await cloudflare('POST', '/accounts/:account/pages/projects', {
      name: project,
      production_branch: 'main',
    }));
  return made.subdomain;
}

// The DNS step of a Pages address: a new record, a CNAME pointed at the address of this project again
// (error 1014 when it leads to a project of another account), or nothing. Any other record stays.
export function recordStep(records, host, target) {
  const [found] = records;
  if (!found) return { method: 'POST', body: { type: 'CNAME', name: host, content: target, proxied: true } };
  if (found.type === 'CNAME' && found.content !== target)
    return { method: 'PATCH', id: found.id, body: { content: target } };
  return null;
}

// Keeps the custom domain of the project and its DNS record in place; target: the project address.
export async function ensurePagesDomain(project, host, zoneName, target) {
  const domains = await cloudflare('GET', `/accounts/:account/pages/projects/${project}/domains`);
  if (!domains.some((domain) => domain.name === host)) {
    await cloudflare('POST', `/accounts/:account/pages/projects/${project}/domains`, { name: host });
  }
  const [zone] = await cloudflare('GET', `/zones?name=${zoneName}`);
  const records = await cloudflare('GET', `/zones/${zone.id}/dns_records?name=${host}`);
  const step = recordStep(records, host, target);
  if (step)
    await cloudflare(step.method, `/zones/${zone.id}/dns_records${step.id ? `/${step.id}` : ''}`, step.body);
}
