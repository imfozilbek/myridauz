import type { BotLoad } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageRow } from '../manage/manage-page';

// «Botlar xabarlari» (G85 T1, docs/122): what each bot sent in the period, how often Telegram asked it
// to wait (429), what was lost after the last try and its busiest second; the operations of the queue
// a day. A 429 or a lost message is marked.
export function BotsSection({
  bots,
  queueOps,
}: {
  readonly bots: readonly BotLoad[];
  readonly queueOps: number;
}) {
  const { t, formatNumber } = useI18n();
  // A bot that only lost people (G87) sent nothing: it is in «Botni bloklaganlar» alone.
  const busy = bots.filter((load) => load.sent + load.limited + load.dead > 0);
  return (
    <ManageGroup title={t('stats.bots.title')}>
      {busy.map((load) => (
        <ManageRow
          key={load.bot}
          icon="send"
          title={t(`stats.bots.bot.${load.bot}`)}
          hint={t('stats.bots.hint', {
            limited: formatNumber(load.limited),
            dead: formatNumber(load.dead),
            peak: formatNumber(load.peak),
          })}
          alarm={load.limited + load.dead > 0}
          value={formatNumber(load.sent)}
        />
      ))}
      <ManageRow icon="statistics" title={t('stats.bots.queue')} value={formatNumber(queueOps)} />
    </ManageGroup>
  );
}

// «Botni bloklaganlar» (G87, docs/191): how many people blocked each bot in the period and how many
// came back to it; only the numbers, never who. The bots nobody left are not shown.
export function BlocksSection({ bots }: { readonly bots: readonly BotLoad[] }) {
  const { t, formatNumber } = useI18n();
  const left = bots.filter((load) => load.blocked + load.unblocked > 0);
  if (left.length === 0) return null;
  return (
    <ManageGroup title={t('stats.blocks.title')}>
      {left.map((load) => (
        <ManageRow
          key={load.bot}
          icon="blocked"
          title={t(`stats.bots.bot.${load.bot}`)}
          hint={t('stats.blocks.back', { count: formatNumber(load.unblocked) })}
          value={formatNumber(load.blocked)}
        />
      ))}
    </ManageGroup>
  );
}
