import type { CompanyRepository, StoredCompanyVersion } from '../application/ports';

// The same table as migrations/0033_company.sql, in memory for tests and local runs.
export function createMemoryCompany(): CompanyRepository {
  const versions: StoredCompanyVersion[] = [];
  return {
    versions: async () => [...versions].reverse(),
    addVersion: async (company, changedBy, at) => {
      versions.push({ version: versions.length + 1, company, changedBy, changedAt: at });
    },
  };
}
