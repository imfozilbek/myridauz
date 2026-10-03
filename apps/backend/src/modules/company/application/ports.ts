import type { Company, CompanyVersion } from '@platform/contracts';

// Ports of the company module: D1 in production, memory in tests.
export type CompanyRepository = {
  // Newest first; empty until the owner saves the requisites (migrations/0033_company.sql).
  versions(): Promise<CompanyVersion[]>;
  addVersion(company: Company, changedBy: number, at: number): Promise<void>;
};

export type CompanyDeps = { readonly company: CompanyRepository; readonly now: () => number };
