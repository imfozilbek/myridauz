import { LEGAL_EDITION, type LegalDocument } from '@platform/contracts';
import { legalEdition, legalSections, legalTitle, legalValues } from '@platform/i18n';
import { Caption, Text, Title } from '@telegram-apps/telegram-ui';
import { List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { BackButton } from '../telegram/back-button';
import { useScreenBackground } from '../telegram/screen-background';
import './legal.css';

type Props = { readonly document: LegalDocument; readonly onBack: () => void };

// One of the three documents, with its edition (docs/30). The numbers come from the brand config.
export function LegalScreen({ document, onBack }: Props) {
  useScreenView(`legal.${document}`);
  useScreenBackground('grouped');
  const i18n = useI18n();
  const values = legalValues(i18n, useBrand());
  return (
    <div className="legal">
      <BackButton onClick={onBack} />
      <Title weight="1" className="legal-title">
        {i18n.t(legalTitle(document))}
      </Title>
      <Caption className="legal-edition">{legalEdition(i18n, LEGAL_EDITION)}</Caption>
      <List>
        {legalSections(document).map((section, index) => (
          <Section key={section.title} header={`${index + 1}. ${i18n.t(section.title, values)}`}>
            <Text className="legal-text">{i18n.t(section.text, values)}</Text>
          </Section>
        ))}
      </List>
    </div>
  );
}
