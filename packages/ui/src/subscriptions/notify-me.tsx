import type { TranslationKey } from '@platform/i18n';
import { useState } from 'react';
import { useAccount } from '../account/account-context';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { WayRow } from '../find/way-row';
import { errorKey } from '../market/error-text';
import { noonOf } from '../market/when';
import { ChoiceRows } from '../sheet/choice-rows';
import { FormSheet } from '../sheet/form-sheet';
import { ActionFailure } from '../states/action-failure';
import { haptic } from '../telegram/feedback';

// The tiles the mockup drew anew have smaller icons than the rows of the list (G78 sheet 2).
const SMALL = 18;

type Props = {
  readonly from: string;
  readonly to: string;
  readonly date: string;
  // «Toshkent → Samarqand» over the choice, where the names of the places are known.
  readonly way?: string;
  // Opened from a channel post: the choice of the day at once.
  readonly open?: boolean;
  // Under a trip that takes nobody the bell is small, as the tile of a new row (G78 П13).
  readonly small?: boolean;
};

type Step = 'ask' | 'when' | 'busy' | 'done';
type Day = 'day' | 'any';

// A passenger waits for the trips of the search, a driver for the requests of the board (G78 sheet 3).
const WORDS = {
  passenger: { hint: 'find.notifyHint', dayHint: 'subscriptions.when.dayHint', screen: 'market.results' },
  driver: {
    hint: 'subscriptions.notifyHintDriver',
    dayHint: 'subscriptions.when.dayHintDriver',
    screen: 'requests.board',
  },
} as const;

// «Xabar bering» (docs/24, G78 П13): the bot tells when a trip or a request on this route comes. A
// row; its sheet asks the day and a tap on a day subscribes at once, nothing to type and no button.
// Subscribed, the row turns green in its place.
export function NotifyMe({ from, to, date, way, open = false, small = false }: Props) {
  const { t, formatDate } = useI18n();
  const { track } = useAnalytics();
  const { subscriptions } = useApiClients();
  const words = WORDS[useAccount()?.app === 'driver' ? 'driver' : 'passenger'];
  const [step, setStep] = useState<Step>(open ? 'when' : 'ask');
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  const subscribe = async (day: Day) => {
    if (step === 'busy') return;
    setStep('busy');
    setFailure(null);
    try {
      await subscriptions.subscribe({ from, to, date: day === 'day' ? date : null, woman: false });
      track({ name: 'route_subscribed', screen: words.screen });
      haptic.success();
      setStep('done');
    } catch (error) {
      haptic.error();
      setFailure(errorKey(error));
      setStep('when');
    }
  };
  if (step === 'done')
    return (
      <WayRow
        icon="selected"
        tone="done"
        iconSize={SMALL}
        title={t('subscriptions.done')}
        hint={t('subscriptions.doneHint')}
      />
    );
  const question = t('subscriptions.when.title');
  return (
    <>
      <WayRow
        icon="subscriptions"
        {...(small ? { iconSize: SMALL } : {})}
        title={t('subscriptions.notify')}
        hint={t(words.hint)}
        onClick={() => setStep('when')}
      />
      <FormSheet
        open={step !== 'ask'}
        title={t('subscriptions.notify')}
        hint={way ? t('subscriptions.when.hint', { way, question }) : question}
        onClose={() => (setFailure(null), setStep('ask'))}
      >
        <ChoiceRows
          name="notify-day"
          onPick={(day) => void subscribe(day)}
          choices={[
            {
              key: 'day',
              title: t('subscriptions.when.day', { day: formatDate(noonOf(date)) }),
              hint: t(words.dayHint),
            },
            { key: 'any', title: t('subscriptions.when.any'), hint: t('subscriptions.when.anyHint') },
          ]}
        />
        <ActionFailure error={failure} />
      </FormSheet>
    </>
  );
}
