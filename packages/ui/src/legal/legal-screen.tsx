import type { LegalDocument } from '@platform/contracts';
import { legalEdition, legalSections, legalTitle, legalValues } from '@platform/i18n';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { useRequisites } from './use-requisites';
import './legal.css';

type Props = { readonly document: LegalDocument; readonly onBack: () => void };

// One of the three documents, with its edition (docs/30): all the sections open in one white card,
// read from top to bottom (G75, mockup g75/5 A). The numbers come from the brand config, the
// requisites and the edition from the database (G34).
export function LegalScreen({ document, onBack }: Props) {
  useScreenView(`legal.${document}`);
  useScreenBackground();
  const i18n = useI18n();
  const requisites = useRequisites();
  const brand = useBrand();
  const values = legalValues(i18n, brand, requisites?.company ?? null);
  return (
    <div className="legal" style={brandVars(brand.theme.colors)}>
      <Screen onBack={onBack} />
      <h1 className="legal-title">
        {i18n.t(legalTitle(document))}
        <small>{requisites ? legalEdition(i18n, requisites.edition) : '\u00a0'}</small>
      </h1>
      <div className="legal-card">
        {legalSections(document).map((section, index) => (
          <section key={section.title}>
            <h3>{`${index + 1}. ${i18n.t(section.title, values)}`}</h3>
            <p>{i18n.t(section.text, values)}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
