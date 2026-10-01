import type { PricingPreview } from '@platform/contracts';
import { Title, Text } from '@telegram-apps/telegram-ui';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { RouteView } from '../market/route-view';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';
import '../market/market.css';
import './pricing.css';

type PricingPreviewProps = {
  readonly preview: PricingPreview;
  readonly onBack: () => void;
  readonly onSave: () => void;
};

// How the prices change on the main directions before the team saves new variables (docs/23):
// how many change, and on each changed row the new price marked (docs/86 V13).
export function PricingPreviewScreen({ preview, onBack, onSave }: PricingPreviewProps) {
  useScreenView('pricing.preview');
  const { t, formatMoney } = useI18n();
  const changed = preview.rows.filter((row) => row.after !== row.before).length;
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {t('pricing.previewTitle')}
      </Title>
      <Text className="market-subtitle">
        {changed > 0 ? t('pricing.previewCount', { count: String(changed) }) : t('pricing.previewNone')}
      </Text>
      <List>
        <Section footer={t('pricing.previewHint')}>
          {preview.rows.map((row) => (
            <Cell
              key={`${row.from}:${row.to}`}
              subtitle={
                row.after === row.before ? (
                  formatMoney(row.after)
                ) : (
                  <>
                    {`${formatMoney(row.before)} → `}
                    <span className="price-changed">{formatMoney(row.after)}</span>
                  </>
                )
              }
              description={t('pricing.km', { km: String(row.km) })}
            >
              <RouteView from={row.from} to={row.to} />
            </Cell>
          ))}
        </Section>
      </List>
      <MainButton text={t('pricing.save')} onClick={onSave} />
    </div>
  );
}
