import { ApiError } from '@platform/api-client';
import { companyEdition, type Company, type CompanyState } from '@platform/contracts';
import { legalCompany, type TranslationKey } from '@platform/i18n';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManagePage, ManageRow } from '../manage/manage-page';
import { errorKey } from '../market/error-text';
import { useUnsavedGuard } from '../screen/unsaved-guard';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import {
  COMPANY_FIELDS,
  CompanyFields,
  EMPTY_DRAFT,
  invalidFields,
  type CompanyDraft,
} from './company-fields';
import { CompanyHistory } from './company-history';
import './company.css';

type Props = { readonly loaded: CompanyState; readonly onBack: () => void };

const draftOf = (state: CompanyState): CompanyDraft => state.current?.company ?? EMPTY_DRAFT;

// A wrong field has its own words; other failures read like everywhere else (docs/65 B3).
const saveError = (error: unknown): TranslationKey =>
  error instanceof ApiError && error.code === 'company.invalid_input'
    ? 'errors.company.invalid_input'
    : errorKey(error);

// The form in one card, the live line of the offer under it and the history (docs/96 T22 … T27,
// G78 sheet 5). Only the owner saves; a moderator reads the same screen without the button (docs/02).
export function CompanyEditor({ loaded, onBack }: Props) {
  const i18n = useI18n();
  const { t } = i18n;
  const brand = useBrand();
  const { company } = useApiClients();
  const [state, setState] = useState(loaded);
  const [draft, setDraft] = useState(() => draftOf(loaded));
  const [checked, setChecked] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  const before = draftOf(state);
  const dirty = COMPANY_FIELDS.some((field) => draft[field] !== before[field]);
  const guard = useUnsavedGuard(dirty);
  const invalid = checked ? invalidFields(draft) : [];
  const change = (field: keyof Company, value: string) => {
    setDraft((now) => ({ ...now, [field]: value }));
    setSaved(null);
    setFailure(null);
  };
  const save = () => {
    setChecked(true);
    if (invalidFields(draft).length > 0) return haptic.error();
    company.save(draft).then(
      (next) => {
        haptic.success();
        setState(next);
        setDraft(draftOf(next));
        setChecked(false);
        if (next.current) setSaved(companyEdition(next.current.version, next.current.changedAt).version);
      },
      (error: unknown) => {
        haptic.error();
        setFailure(saveError(error));
      },
    );
  };
  // Live, as typed; with no name yet the documents name the brand (packages/i18n/src/legal.ts).
  const line = draft.legalName.trim() ? legalCompany(i18n, draft) : brand.name;
  return (
    <ManagePage title={t('legal.admin.title')} onBack={guard(onBack)}>
      {saved ? (
        <ManageGroup>
          <ManageRow icon="approved" tone="success" title={t('legal.admin.saved', { version: saved })} />
        </ManageGroup>
      ) : null}
      <ManageGroup>
        <CompanyFields draft={draft} invalid={invalid} onChange={change} />
      </ManageGroup>
      {invalid.includes('stir') ? <Text className="step-error">{t('legal.admin.stirInvalid')}</Text> : null}
      {invalid.length > 0 && !invalid.includes('stir') ? (
        <Text className="step-error">{t('errors.company.invalid_input')}</Text>
      ) : null}
      {failure ? <Text className="step-error">{t(failure)}</Text> : null}
      <ManageGroup title={t('legal.admin.preview')}>
        <div className="navbat-row manage-row">
          <span className="navbat-words">
            <span className="navbat-hint manage-row-hint company-line">{line}</span>
          </span>
        </div>
      </ManageGroup>
      <CompanyHistory history={state.history} />
      {dirty ? <MainButton text={t('legal.admin.save')} onClick={save} /> : null}
    </ManagePage>
  );
}
