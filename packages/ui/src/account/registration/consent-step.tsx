import { Text } from '@telegram-apps/telegram-ui';
import type { LegalDocument } from '@platform/contracts';
import { useState } from 'react';
import { List } from '../../components';
import { useScreenView } from '../../context/analytics-context';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { LegalLinks } from '../../legal/legal-links';
import { LegalScreen } from '../../legal/legal-screen';
import { Screen } from '../../screen/screen';
import { MainButton } from '../../telegram/bottom-button';
import { StepLayout } from '../step-layout';

// Consent is required by the personal data law (docs/30): "Roziman" accepts the documents,
// each of them opens before that. «Назад» goes to the welcome (docs/94 B7).
type ConsentStepProps = { readonly onBack?: () => void; readonly onAccept: () => void };
export function ConsentStep({ onBack, onAccept }: ConsentStepProps) {
  useScreenView('registration.consent');
  const { t } = useI18n();
  const brand = useBrand();
  const [reading, setReading] = useState<LegalDocument | null>(null);
  if (reading) return <LegalScreen document={reading} onBack={() => setReading(null)} />;
  return (
    <StepLayout
      icon="document"
      title={t('account.consent.title')}
      hint={t('account.consent.text', { brand: brand.name })}
    >
      <Screen {...(onBack ? { onBack } : {})} />
      {/* The fear of the first minute: the phone number (docs/86 T13). */}
      <Text className="step-note">{t('account.consent.hidden')}</Text>
      <List>
        <LegalLinks onOpen={setReading} />
      </List>
      <MainButton text={t('account.consent.accept')} onClick={onAccept} />
    </StepLayout>
  );
}
