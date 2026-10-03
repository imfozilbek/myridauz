import { companyEdition, type Company, type CompanyState, type PublicCompany } from '@platform/contracts';
import type { CompanyDeps } from './ports';

// The requisites in the documents of the Mini Apps and the landing, with their edition (docs/30).
export async function publicCompany(deps: CompanyDeps): Promise<PublicCompany> {
  const [current] = await deps.company.versions();
  return {
    company: current?.company ?? null,
    edition: current ? companyEdition(current.version, current.changedAt) : companyEdition(null, 0),
  };
}

// The admin screen: every member of the team reads, only the owner changes (docs/02).
export async function companyState(deps: CompanyDeps, canEdit: boolean): Promise<CompanyState> {
  const history = await deps.company.versions();
  return { current: history[0] ?? null, history, canEdit };
}

// Every save is a new version: the history keeps who and when (G34).
export async function saveCompany(deps: CompanyDeps, company: Company, by: number) {
  await deps.company.addVersion(company, by, deps.now());
  return companyState(deps, true);
}
