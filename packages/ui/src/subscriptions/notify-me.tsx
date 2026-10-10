import { Button, Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { errorKey } from '../market/error-text';
import { noonOf } from '../market/when';
import { ChoiceRows } from '../sheet/choice-rows';
import { FormSheet } from '../sheet/form-sheet';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import './subscriptions.css';

type Props = {
  readonly from: string;
  readonly to: string;
  readonly date: string;
  // «Toshkent → Samarqand» over the choice, where the names of the places are known.
  readonly way?: string;
  // Opened from a channel post: the choice of the day at once.
  readonly open?: boolean;
};

type Step = 'ask' | 'when' | 'busy' | 'done' | { readonly failed: unknown };
type Day = 'day' | 'any';

// "Xabar bering" when the search found nothing (docs/24): the bot tells when a trip or a request
// on this route comes. The day is chosen in a sheet, nothing to type (docs/19, mockup g75/3 A).
export function NotifyMe({ from, to, date, way, open = false }: Props) {
  const { t, formatDate } = useI18n();
  const { track } = useAnalytics();
  const { subscriptions } = useApiClients();
  const [step, setStep] = useState<Step>(open ? 'when' : 'ask');
  const [day, setDay] = useState<Day>('any');
  const subscribe = async () => {
    setStep('busy');
    try {
      await subscriptions.subscribe({ from, to, date: day === 'day' ? date : null, woman: false });
      track({ name: 'route_subscribed', screen: 'market.results' });
      haptic.success();
      setStep('done');
    } catch (error) {
      haptic.error();
      setStep({ failed: error });
    }
  };
  if (step === 'done') return <Text className="step-hint notify-note">{t('subscriptions.done')}</Text>;
  if (typeof step === 'object')
    return <Text className="step-hint notify-note">{t(errorKey(step.failed))}</Text>;
  const asking = step === 'when' || step === 'busy';
  const question = t('subscriptions.when.title');
  return (
    <>
      {asking ? null : (
        <Button size="m" onClick={() => setStep('when')}>
          {t('subscriptions.notify')}
        </Button>
      )}
      <FormSheet
        open={asking}
        title={t('subscriptions.notify')}
        hint={way ? t('subscriptions.when.hint', { way, question }) : question}
        onClose={() => setStep('ask')}
      >
        <ChoiceRows
          name="notify-day"
          value={day}
          onPick={setDay}
          choices={[
            {
              key: 'day',
              title: t('subscriptions.when.day', { day: formatDate(noonOf(date)) }),
              hint: t('subscriptions.when.dayHint'),
            },
            { key: 'any', title: t('subscriptions.when.any'), hint: t('subscriptions.when.anyHint') },
          ]}
        />
        {asking ? <MainButton text={t('subscriptions.notify')} onClick={subscribe} /> : null}
      </FormSheet>
    </>
  );
}
