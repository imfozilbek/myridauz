import type { LegalDocument } from '@platform/contracts';
import { legalEdition, legalSections, legalTitle, legalValues } from '@platform/i18n';
import { Caption, Title } from '@telegram-apps/telegram-ui';
import { List } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { LegalSection } from './legal-section';
import { useRequisites } from './use-requisites';
import './legal.css';

type Props = { readonly document: LegalDocument; readonly onBack: () => void };

// One of the three documents, with its edition (docs/30). The numbers come from the brand config,
// the requisites and the edition from the database (G34).
export function LegalScreen({ document, onBack }: Props) {
  useScreenView(`legal.${document}`);
  useScreenBackground();
  const i18n = useI18n();
  const requisites = useRequisites();
  const values = legalValues(i18n, useBrand(), requisites?.company ?? null);
  return (
    <div className="legal">
      <Screen onBack={onBack} />
      <Title weight="1" className="legal-title">
        {i18n.t(legalTitle(document))}
      </Title>
      <Caption className="legal-edition">
        {requisites ? legalEdition(i18n, requisites.edition) : '\u00a0'}
      </Caption>
      <List>
        {legalSections(document).map((section, index) => (
          <LegalSection
            key={section.title}
            title={`${index + 1}. ${i18n.t(section.title, values)}`}
            text={i18n.t(section.text, values)}
          />
        ))}
      </List>
    </div>
  );
}
