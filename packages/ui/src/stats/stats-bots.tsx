import type { BotBlock, BotLoad } from '@platform/contracts';
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
  return (
    <ManageGroup title={t('stats.bots.title')}>
      {bots.map((load) => (
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
// came back to it; only the numbers, never who. The bots nobody left are not in the list.
export function BlocksSection({ blocks }: { readonly blocks: readonly BotBlock[] }) {
  const { t, formatNumber } = useI18n();
  if (blocks.length === 0) return null;
  return (
    <ManageGroup title={t('stats.blocks.title')}>
      {blocks.map((block) => (
        <ManageRow
          key={block.bot}
          icon="blocked"
          title={t(`stats.bots.bot.${block.bot}`)}
          hint={t('stats.blocks.back', { count: formatNumber(block.unblocked) })}
          value={formatNumber(block.blocked)}
        />
      ))}
    </ManageGroup>
  );
}
