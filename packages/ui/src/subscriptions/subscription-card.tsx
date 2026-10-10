import type { Subscription } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { noonOf } from '../market/when';
import { RowCard } from '../mine/row-card';
import { useWay } from '../mine/use-way';
import type { useFailure } from '../states/use-failure';
import { confirm, haptic } from '../telegram/feedback';

type CardProps = {
  readonly subscription: Subscription;
  readonly onChange: () => void;
  readonly onAct: Pick<ReturnType<typeof useFailure>, 'fail' | 'clear'>;
  readonly onRemoved: () => void;
};

export function SubscriptionCard({ subscription, onChange, onAct, onRemoved }: CardProps) {
  const { t, formatDate } = useI18n();
  const { subscriptions } = useApiClients();
  const way = useWay();
  const [busy, setBusy] = useState(false);
  const { date, woman, expired, expiresAt } = subscription;
  const act = async (action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    onAct.clear();
    try {
      await action();
      haptic.success();
    } catch (caught) {
      onAct.fail(caught);
    }
    setBusy(false);
    onChange();
  };
  // Asked first in the native window; then a short line can bring it back (docs/88 L7, L8).
  const remove = async () => {
    if (!(await confirm(t('subscriptions.removeAsk'), t('subscriptions.remove')))) return;
    await act(async () => {
      await subscriptions.remove(subscription.id);
      onRemoved();
    });
  };
  const when = expired
    ? t('subscriptions.expired')
    : date === null
      ? t('subscriptions.anyUntil', { date: formatDate(new Date(expiresAt)) })
      : t('subscriptions.when.day', { day: formatDate(noonOf(date)) });
  const renew = (
    <button
      type="button"
      className="row-card-link"
      onClick={() => void act(() => subscriptions.renew(subscription.id))}
    >
      {t('subscriptions.renew')}
    </button>
  );
  // «Istalgan kun, 11-noyabrgacha», «Faqat 12-oktabr» or «Muddati tugagan · Uzaytirish» (mockup g75/2 A).
  return (
    <RowCard
      icon="subscriptions"
      title={way(subscription.from, subscription.to)}
      hint={
        <>
          {when}
          {woman ? t('subscriptions.withWoman') : null}
          {expired ? <> · {renew}</> : null}
        </>
      }
      action={{ icon: 'erase', label: t('subscriptions.remove'), onClick: () => void remove() }}
    />
  );
}
