import type { BotLoad } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageRow } from '../manage/manage-page';

// «Botlar xabarlari» (G85 T1, docs/122): what each bot sent in the period, how often Telegram asked it
// to wait (429), what was lost after the last try and its busiest second; the operations of the queue
// a day. A 429 or a lost message is marked. «Botni bloklaganlar» (G87 V1, docs/191) below it.
export function BotsSection({
  bots,
  queueOps,
}: {
  readonly bots: readonly BotLoad[];
  readonly queueOps: number;
}) {
  const { t, formatNumber } = useI18n();
  const sending = bots.filter((load) => load.sent + load.limited + load.dead > 0);
  // G87 V1: who blocked a bot in the period, and who came back after a block.
  const blocking = bots.filter((load) => load.blocked + load.returned > 0);
  return (
    <>
      <ManageGroup title={t('stats.bots.title')}>
        {sending.map((load) => (
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
      {blocking.length > 0 ? (
        <ManageGroup title={t('stats.bots.blocks')}>
          {blocking.map((load) => (
            <ManageRow
              key={load.bot}
              icon="blocked"
              title={t(`stats.bots.bot.${load.bot}`)}
              hint={t('stats.bots.returned', { returned: formatNumber(load.returned) })}
              value={formatNumber(load.blocked)}
            />
          ))}
        </ManageGroup>
      ) : null}
    </>
  );
}
