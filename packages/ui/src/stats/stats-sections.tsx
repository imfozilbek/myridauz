import { MAIN_NUMBERS, type ErrorRow, type Funnel, type Stats } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { CellValue } from '../account/cell-value';
import { Cell, List, Section } from '../components';
import { useI18n } from '../context/i18n-context';

// A drop from this share is where people get stuck: it is marked (docs/29).
const HIGH_DROP = 50;

export function StatsSections({ stats }: { readonly stats: Stats }) {
  const { t, formatNumber, formatTime } = useI18n();
  return (
    <List>
      <Section header={t('stats.numbers')}>
        {MAIN_NUMBERS.map((key) => (
          <Cell key={key} after={<CellValue>{formatNumber(stats.numbers[key])}</CellValue>}>
            {t(`stats.number.${key}`)}
          </Cell>
        ))}
      </Section>
      {stats.events === 'on' ? null : (
        <Text className="stats-note">
          {t(stats.events === 'off' ? 'stats.eventsOff' : 'stats.eventsFailed')}
        </Text>
      )}
      {stats.funnels.map((funnel, index) => (
        <FunnelSection key={funnel.id} funnel={funnel} hint={index === 0} />
      ))}
      {stats.events === 'on' ? <ErrorsSection errors={stats.errors} /> : null}
      <Text className="stats-note">{t('stats.updated', { time: formatTime(new Date(stats.at)) })}</Text>
    </List>
  );
}

function FunnelSection({ funnel, hint }: { readonly funnel: Funnel; readonly hint: boolean }) {
  const { t, formatNumber } = useI18n();
  return (
    <Section header={t(`stats.funnel.${funnel.id}`)} {...(hint ? { footer: t('stats.funnelHint') } : {})}>
      {funnel.steps.map((step) => (
        <Cell
          key={step.step}
          subtitle={
            step.drop ? (
              <span className={step.drop >= HIGH_DROP ? 'stats-high' : undefined}>
                {t('stats.left', { drop: step.drop })}
              </span>
            ) : undefined
          }
          after={<CellValue>{formatNumber(step.count)}</CellValue>}
        >
          {t(`stats.step.${step.step}`)}
        </Cell>
      ))}
    </Section>
  );
}

const APPS = ['passenger', 'driver', 'admin'] as const;
const appName = (app: string) =>
  (APPS as readonly string[]).includes(app) ? (app as (typeof APPS)[number]) : null;

function ErrorsSection({ errors }: { readonly errors: readonly ErrorRow[] }) {
  const { t, formatNumber } = useI18n();
  return (
    <Section header={t('stats.errors')}>
      {errors.length === 0 ? <Cell>{t('stats.errorsEmpty')}</Cell> : null}
      {errors.map((row) => {
        const app = appName(row.app);
        return (
          <Cell
            key={`${row.app}:${row.screen}:${row.code}`}
            subtitle={`${app ? t(`stats.app.${app}`) : row.app} · ${row.screen}`}
            after={<CellValue>{formatNumber(row.count)}</CellValue>}
          >
            {row.code}
          </Cell>
        );
      })}
    </Section>
  );
}
