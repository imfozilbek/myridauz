import {
  ADMIN_COMPANY_PATH,
  companyStateSchema,
  PUBLIC_COMPANY_PATH,
  publicCompanySchema,
  type Company,
  type CompanyState,
  type PublicCompany,
} from '@platform/contracts';
import { ApiError } from './api-error';
import { signedRequest, type SignedOptions } from './signed-request';

// The requisites of the legal documents (G34): everyone reads them without a signature,
// the team opens the admin screen and the owner saves them, signed.
export function createCompanyClient(options: SignedOptions) {
  const { request, post } = signedRequest(options);
  const publicUrl = new URL(
    PUBLIC_COMPANY_PATH.slice(1),
    `${options.baseUrl.replace(/\/$/, '')}/`,
  ).toString();
  const state = async (response: Response) => companyStateSchema.parse(await response.json());
  return {
    current: async (): Promise<PublicCompany> => {
      const response = await options.fetch(publicUrl);
      if (!response.ok) throw new ApiError(response.status);
      return publicCompanySchema.parse(await response.json());
    },
    state: async (): Promise<CompanyState> => state(await request(ADMIN_COMPANY_PATH)),
    save: async (company: Company): Promise<CompanyState> => state(await post(ADMIN_COMPANY_PATH, company)),
  };
}

export type CompanyClient = ReturnType<typeof createCompanyClient>;
