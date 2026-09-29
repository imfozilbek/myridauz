import { Button, Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { Cell, Section } from '../components';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { errorKey } from '../market/error-text';
import { noonOf } from '../market/when';
import { haptic } from '../telegram/feedback';
import './subscriptions.css';

type Props = {
  readonly from: string;
  readonly to: string;
  readonly date: string;
  readonly woman?: boolean;
  // Opened from a channel post: the choice of the day at once.
  readonly open?: boolean;
};

type Step = 'ask' | 'when' | 'busy' | 'done' | { readonly failed: unknown };

// "Xabar bering" when the search found nothing (docs/24): the bot tells when a trip or a request
// on this route comes. The person chooses the day, nothing to type (docs/19).
export function NotifyMe({ from, to, date, woman = false, open = false }: Props) {
  const { t, formatDate } = useI18n();
  const { track } = useAnalytics();
  const { subscriptions } = useApiClients();
  const [step, setStep] = useState<Step>(open ? 'when' : 'ask');
  const subscribe = async (day: string | null) => {
    if (step === 'busy') return;
    setStep('busy');
    try {
      await subscriptions.subscribe({ from, to, date: day, woman });
      track({ name: 'route_subscribed', screen: 'market.results' });
      haptic.success();
      setStep('done');
    } catch (error) {
      haptic.error();
      setStep({ failed: error });
    }
  };
  if (step === 'ask')
    return (
      <Button size="m" onClick={() => setStep('when')}>
        {t('subscriptions.notify')}
      </Button>
    );
  if (step === 'done') return <Text className="step-hint notify-note">{t('subscriptions.done')}</Text>;
  if (typeof step === 'object')
    return <Text className="step-hint notify-note">{t(errorKey(step.failed))}</Text>;
  return (
    <Section header={t('subscriptions.when.title')}>
      <Cell before={<IconTile name="subscriptions" />} onClick={() => void subscribe(date)}>
        {t('subscriptions.when.day', { day: formatDate(noonOf(date)) })}
      </Cell>
      <Cell
        before={<IconTile name="subscriptions" tone="accent" />}
        subtitle={t('subscriptions.when.anyHint')}
        onClick={() => void subscribe(null)}
      >
        {t('subscriptions.when.any')}
      </Cell>
    </Section>
  );
}
