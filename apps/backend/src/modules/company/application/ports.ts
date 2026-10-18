import type { Company, CompanyVersion } from '@platform/contracts';
import type { Names } from '../../../shared/team/who';

// A version as kept: who saved it by the Telegram ID, shown by the name (shared/team/who.ts).
export type StoredCompanyVersion = Omit<CompanyVersion, 'changedBy'> & { readonly changedBy: number };

// Ports of the company module: D1 in production, memory in tests.
export type CompanyRepository = {
  // Newest first; empty until the owner saves the requisites (migrations/0033_company.sql).
  versions(): Promise<StoredCompanyVersion[]>;
  addVersion(company: Company, changedBy: number, at: number): Promise<void>;
};

export type CompanyDeps = {
  readonly company: CompanyRepository;
  readonly names: Names;
  readonly now: () => number;
};
