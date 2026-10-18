import { companyEdition, type Company, type CompanyState, type PublicCompany } from '@platform/contracts';
import { namer } from '../../../shared/team/who';
import type { CompanyDeps } from './ports';

// The requisites in the documents of the Mini Apps and the landing, with their edition (docs/30).
export async function publicCompany(deps: CompanyDeps): Promise<PublicCompany> {
  const [current] = await deps.company.versions();
  return {
    company: current?.company ?? null,
    edition: current ? companyEdition(current.version, current.changedAt) : companyEdition(null, 0),
  };
}

// The admin screen of the owner: the requisites now and every change before (docs/02, G75).
export async function companyState(deps: CompanyDeps): Promise<CompanyState> {
  const stored = await deps.company.versions();
  const nameOf = await namer(
    deps.names,
    stored.map((item) => item.changedBy),
  );
  const history = stored.map((item) => ({ ...item, changedBy: nameOf(item.changedBy) }));
  return { current: history[0] ?? null, history };
}

// Every save is a new version: the history keeps who and when (G34).
export async function saveCompany(deps: CompanyDeps, company: Company, by: number) {
  await deps.company.addVersion(company, by, deps.now());
  return companyState(deps);
}
