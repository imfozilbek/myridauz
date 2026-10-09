import { z } from 'zod';
import { LEGAL_EDITION } from './legal';
import { tashkentDate } from './tashkent-time';

// The requisites of the company in the legal documents (docs/30, G34): the owner enters them in the
// admin Mini App; every save is a new version and a new edition of the documents.
export const PUBLIC_COMPANY_PATH = '/public/company';
export const ADMIN_COMPANY_PATH = '/admin/company';

// STIR: the taxpayer number of Uzbekistan, exactly 9 digits.
const STIR_PATTERN = /^\d{9}$/u;

export const companySchema = z.object({
  legalName: z.string().trim().min(2).max(120),
  form: z.string().trim().min(2).max(40),
  stir: z.string().regex(STIR_PATTERN),
  address: z.string().trim().min(5).max(200),
  email: z.string().trim().pipe(z.email().max(120)),
});
export type Company = z.infer<typeof companySchema>;

export const editionSchema = z.object({ version: z.string(), date: z.string() });
export type Edition = z.infer<typeof editionSchema>;

const VERSION = /^(\d+)\.(\d+)$/u;

// The edition of the documents after save number `version` (1-based) of the requisites:
// the base edition 1.1 becomes 1.2 after the first save, 1.3 after the second, with the date of
// that save in Tashkent. A newer base edition (a new text) keeps its own date when it is later.
export function companyEdition(version: number | null, changedAt: number): Edition {
  if (version === null) return LEGAL_EDITION;
  const [, major = '1', minor = '0'] = VERSION.exec(LEGAL_EDITION.version) ?? [];
  const saved = tashkentDate(changedAt);
  return {
    version: `${major}.${Number(minor) + version}`,
    date: saved > LEGAL_EDITION.date ? saved : LEGAL_EDITION.date,
  };
}

// The answer for everyone: the Mini Apps and the landing. null until the owner enters the requisites.
export const publicCompanySchema = z.object({ company: companySchema.nullable(), edition: editionSchema });
export type PublicCompany = z.infer<typeof publicCompanySchema>;

const companyVersionSchema = z.object({
  version: z.number().int().min(1),
  company: companySchema,
  changedBy: z.number().int(),
  changedAt: z.number().int(),
});
export type CompanyVersion = z.infer<typeof companyVersionSchema>;

// The admin screen of the owner: the requisites now, every change before (newest first).
export const companyStateSchema = z.object({
  current: companyVersionSchema.nullable(),
  history: z.array(companyVersionSchema),
});
export type CompanyState = z.infer<typeof companyStateSchema>;
