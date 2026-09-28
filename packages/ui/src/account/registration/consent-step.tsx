import type { TranslationKey } from '@platform/i18n';
import { Cell, List, Section } from '../../components';
import { useScreenView } from '../../context/analytics-context';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { Icon } from '../../icons';
import { MainButton } from '../../telegram/bottom-button';
import { StepLayout } from '../step-layout';

// The documents are written in G14 (docs/30): until then the links say "soon".
const DOCUMENTS: readonly TranslationKey[] = [
  'account.consent.offer',
  'account.consent.privacy',
  'account.consent.personalData',
];

// Consent is required by the personal data law (docs/30): "Roziman" accepts the documents.
export function ConsentStep({ onAccept }: { readonly onAccept: () => void }) {
  useScreenView('registration.consent');
  const { t } = useI18n();
  const brand = useBrand();
  return (
    <StepLayout
      icon="document"
      title={t('account.consent.title')}
      hint={t('account.consent.text', { brand: brand.name })}
    >
      <List>
        <Section>
          {DOCUMENTS.map((key) => (
            <Cell
              key={key}
              before={<Icon name="document" color={brand.theme.colors.brand} />}
              after={t('account.consent.soon')}
              multiline
            >
              {t(key)}
            </Cell>
          ))}
        </Section>
      </List>
      <MainButton text={t('account.consent.accept')} onClick={onAccept} />
    </StepLayout>
  );
}
