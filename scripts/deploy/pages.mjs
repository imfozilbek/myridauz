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
  const record = { type: 'CNAME', name: host, content: target, proxied: true };
  const cname = records.find((one) => one.type === 'CNAME');
  if (cname) return cname.content === target ? null : { method: 'PATCH', id: cname.id, body: record };
  return records.length === 0 ? { method: 'POST', body: record } : null;
}

// Keeps the custom domain of the project and its DNS record in place; target: the project address. A
// domain added while its record led elsewhere checks its record again.
export async function ensurePagesDomain(project, host, zoneName, target) {
  const domains = `/accounts/:account/pages/projects/${project}/domains`;
  const domain = (await cloudflare('GET', domains)).find((one) => one.name === host);
  if (!domain) await cloudflare('POST', domains, { name: host });
  const [zone] = await cloudflare('GET', `/zones?name=${zoneName}`);
  const records = await cloudflare('GET', `/zones/${zone.id}/dns_records?name=${host}`);
  const step = recordStep(records, host, target);
  if (step)
    await cloudflare(step.method, `/zones/${zone.id}/dns_records${step.id ? `/${step.id}` : ''}`, step.body);
  // A failed retry never stops the deploy: Cloudflare checks pending domains again by itself.
  if (domain && domain.status !== 'active')
    await cloudflare('PATCH', `${domains}/${host}`).catch((error) =>
      console.warn(`deploy: ${host} ${error}`),
    );
}
