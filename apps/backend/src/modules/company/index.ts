import type { Bindings } from '../../env';
import type { CompanyDeps } from './application/ports';
import { companyRoutes } from './http/company-routes';
import { d1Company } from './infrastructure/d1-company';
import { createMemoryCompany } from './infrastructure/memory-company';

// Without D1 (tests) the requisites live in memory.
const localCompany = createMemoryCompany();

const companyDeps = (env: Bindings): CompanyDeps => ({
  company: env.DB ? d1Company(env.DB) : localCompany,
  now: Date.now,
});

export const companyModule = companyRoutes(companyDeps);
