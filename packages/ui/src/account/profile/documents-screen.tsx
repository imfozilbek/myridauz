import type { LegalDocument } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { List } from '../../components';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { LegalLinks } from '../../legal/legal-links';
import { LegalScreen } from '../../legal/legal-screen';
import { Screen } from '../../screen/screen';
import { useScreenBackground } from '../../telegram/screen-background';
import '../../market/market.css';

// «Hujjatlar» of «Profil» (G65, mockup g65/3): the offer, the privacy and the rules (docs/30). No
// mockup of its own: a title over the list, as «Safarlar tarixi»; the gradient stays on top (docs/121 §5).
export function DocumentsScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('profile.documents');
  useScreenBackground();
  const { t } = useI18n();
  const [open, setOpen] = useState<LegalDocument | null>(null);
  if (open) return <LegalScreen document={open} onBack={() => setOpen(null)} />;
  return (
    <div className="market">
      <Screen onBack={onBack} />
      <Title weight="1" className="market-title">
        {t('account.profile.documents')}
      </Title>
      <List>
        <LegalLinks onOpen={setOpen} />
      </List>
    </div>
  );
}
