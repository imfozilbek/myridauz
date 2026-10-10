import { companySchema, type Company } from '@platform/contracts';
import { Field } from '../components';
import { useI18n } from '../context/i18n-context';

export const COMPANY_FIELDS = ['legalName', 'form', 'stir', 'address', 'email'] as const;
export type CompanyDraft = Record<keyof Company, string>;

export const EMPTY_DRAFT: CompanyDraft = { legalName: '', form: '', stir: '', address: '', email: '' };

// The fields that do not pass the rules of the API (contracts/company.ts), to mark them red.
export function invalidFields(draft: CompanyDraft): readonly (keyof Company)[] {
  const parsed = companySchema.safeParse(draft);
  if (parsed.success) return [];
  return COMPANY_FIELDS.filter((field) => parsed.error.issues.some((issue) => issue.path[0] === field));
}

type Props = {
  readonly draft: CompanyDraft;
  readonly invalid: readonly (keyof Company)[];
  readonly onChange: (field: keyof Company, value: string) => void;
};

// The five requisites of the documents (G34, docs/96 T23): the owner changes them (G75).
export function CompanyFields({ draft, invalid, onChange }: Props) {
  const { t } = useI18n();
  return COMPANY_FIELDS.map((field) => (
    <Field
      key={field}
      label={t(`legal.admin.${field}`)}
      value={draft[field]}
      status={invalid.includes(field) ? 'error' : 'default'}
      {...(field === 'stir' ? { inputMode: 'numeric' as const, maxLength: 9 } : {})}
      {...(field === 'email' ? { type: 'email', inputMode: 'email' as const } : {})}
      onChange={(event) => onChange(field, event.target.value)}
    />
  ));
}
