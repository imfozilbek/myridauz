import type { LegalDocument } from '@platform/contracts';
import { useState } from 'react';
import { List } from '../../components';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { LegalLinks } from '../../legal/legal-links';
import { LegalScreen } from '../../legal/legal-screen';
import { Screen } from '../../screen/screen';
import { useScreenBackground } from '../../telegram/screen-background';

// «Hujjatlar» of «Profil» (G65, mockup g65/3): the offer, the privacy and the rules (docs/30).
export function DocumentsScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('profile.documents');
  useScreenBackground();
  const { t } = useI18n();
  const [open, setOpen] = useState<LegalDocument | null>(null);
  if (open) return <LegalScreen document={open} onBack={() => setOpen(null)} />;
  return (
    <List>
      <Screen onBack={onBack} />
      <LegalLinks header={t('account.profile.documents')} onOpen={setOpen} />
    </List>
  );
}
