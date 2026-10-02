import type { PublicCompany } from '@platform/contracts';
import { fill } from './format';

type Fetch = (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

// "2026-10-05" with the templates of the page: "5-oktabr 2026", as legalEdition writes it.
function editionDate(date: string, templates: readonly string[]) {
  const [year = '', month = '', day = ''] = date.split('-');
  return `${fill(templates[Number(month) - 1] ?? '{day}', 'day', String(Number(day)))} ${year}`;
}

// A legal document on the site (G34): the page is built without the requisites, so the script asks
// the public API for the requisites and the edition the owner saved. Without an answer the page
// stays as it is: the brand name and the base edition, never a placeholder.
export async function initCompany(root: HTMLElement, load: Fetch = (url) => fetch(url)) {
  const data = root.dataset;
  let answer: PublicCompany;
  try {
    const response = await load(data['legal'] ?? '');
    if (!response.ok) return;
    answer = (await response.json()) as PublicCompany;
  } catch {
    // No internet for a moment: the page keeps what it was built with.
    return;
  }
  const { company, edition } = answer;
  const date = editionDate(edition.date, (data['dates'] ?? '').split('|'));
  const shown = fill(fill(data['editionTemplate'] ?? '', 'version', edition.version), 'date', date);
  const node = root.querySelector('[data-edition]');
  if (node && shown) node.textContent = shown;
  if (!company) return;
  const line = [
    ['companyName', company.legalName],
    ['companyForm', company.form],
    ['companyStir', company.stir],
    ['companyAddress', company.address],
  ].reduce((text, [key = '', value = '']) => fill(text, key, value), data['companyTemplate'] ?? '');
  // textContent only: a value from the API never becomes markup.
  for (const span of root.querySelectorAll('[data-company]')) span.textContent = line;
  for (const span of root.querySelectorAll('[data-email]')) span.textContent = company.email;
}
