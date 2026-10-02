import type { CompanyVersion } from '@platform/contracts';
import type { CompanyRepository } from '../application/ports';

type VersionRow = {
  version: number;
  legal_name: string;
  form: string;
  stir: string;
  address: string;
  email: string;
  changed_by: number;
  changed_at: number;
};

const toVersion = (row: VersionRow): CompanyVersion => ({
  version: row.version,
  company: {
    legalName: row.legal_name,
    form: row.form,
    stir: row.stir,
    address: row.address,
    email: row.email,
  },
  changedBy: row.changed_by,
  changedAt: row.changed_at,
});

// Table company_versions (migrations/0033_company.sql).
export const d1Company = (db: D1Database): CompanyRepository => ({
  versions: async () =>
    (await db.prepare('SELECT * FROM company_versions ORDER BY version DESC').all<VersionRow>()).results.map(
      toVersion,
    ),
  addVersion: async (company, changedBy, at) => {
    await db
      .prepare(
        `INSERT INTO company_versions (legal_name, form, stir, address, email, changed_by, changed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(company.legalName, company.form, company.stir, company.address, company.email, changedBy, at)
      .run();
  },
});
