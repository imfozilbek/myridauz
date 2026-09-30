import { LEGAL_EDITION, type LegalDocument } from '@platform/contracts';
import { Caption, Text, Title } from '@telegram-apps/telegram-ui';
import { List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { BackButton } from '../telegram/back-button';
import { useScreenBackground } from '../telegram/screen-background';
import { sectionsOf, titleOf } from './legal-texts';
import './legal.css';

type Props = { readonly document: LegalDocument; readonly onBack: () => void };

// One of the three documents, with its edition (docs/30). The numbers come from the brand config.
export function LegalScreen({ document, onBack }: Props) {
  useScreenView(`legal.${document}`);
  useScreenBackground('grouped');
  const { t, formatDate, formatMoney } = useI18n();
  const brand = useBrand();
  const { company, commission, promo } = brand;
  const values = {
    brand: brand.name,
    company: t('legal.company', {
      companyName: company.legalName,
      companyForm: company.form,
      companyStir: company.stir,
      companyAddress: company.address,
    }),
    adminBot: brand.bots.admin,
    percent: String(commission.percent),
    minPerSeat: formatMoney(commission.minPerSeat),
    bonus: formatMoney(promo.amount),
    grants: String(promo.grants),
    days: String(promo.days),
    windowDays: String(promo.windowDays),
  };
  const date = formatDate(new Date(`${LEGAL_EDITION.date}T12:00:00+05:00`));
  return (
    <div className="legal">
      <BackButton onClick={onBack} />
      <Title weight="1" className="legal-title">
        {t(titleOf(document))}
      </Title>
      <Caption className="legal-edition">
        {t('legal.edition', {
          version: LEGAL_EDITION.version,
          date: `${date} ${LEGAL_EDITION.date.slice(0, 4)}`,
        })}
      </Caption>
      <List>
        {sectionsOf(document).map((section, index) => (
          <Section key={section.title} header={`${index + 1}. ${t(section.title, values)}`}>
            <Text className="legal-text">{t(section.text, values)}</Text>
          </Section>
        ))}
      </List>
    </div>
  );
}
