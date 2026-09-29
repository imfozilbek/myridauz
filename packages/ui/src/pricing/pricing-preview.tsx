import type { PricingPreview } from '@platform/contracts';
import { Title, Text } from '@telegram-apps/telegram-ui';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { usePlaceName } from '../market/places-gate';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';
import '../market/market.css';

type PricingPreviewProps = {
  readonly preview: PricingPreview;
  readonly onBack: () => void;
  readonly onSave: () => void;
};

// "Было → стало" on the main directions before the team saves new variables (docs/23).
export function PricingPreviewScreen({ preview, onBack, onSave }: PricingPreviewProps) {
  useScreenView('pricing.preview');
  const { t, formatMoney } = useI18n();
  const place = usePlaceName();
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {t('pricing.previewTitle')}
      </Title>
      <Text className="market-subtitle">{t('pricing.previewHint')}</Text>
      <List>
        <Section>
          {preview.rows.map((row) => (
            <Cell
              key={`${row.from}:${row.to}`}
              multiline
              subtitle={`${formatMoney(row.before)} → ${formatMoney(row.after)}`}
              description={t('pricing.km', { km: String(row.km) })}
            >
              {place(row.to, false)}
            </Cell>
          ))}
        </Section>
      </List>
      <MainButton text={t('pricing.save')} onClick={onSave} />
    </div>
  );
}
