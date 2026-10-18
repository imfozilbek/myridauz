import type { Channel, ChannelHealth } from '@platform/contracts';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManagePage, ManageRow } from '../manage/manage-page';
import { useLoad } from '../market/use-list';
import { useDirectory } from '../places/use-directory';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { MainButton } from '../telegram/bottom-button';
import { openInTelegram } from '../telegram/feedback';
import { ChannelEdit } from './channel-edit';
import { ChannelMoves } from './channel-moves';
import { ChannelReactions } from './channel-reactions';
import { channelName } from './channel-name';

type Props = { readonly onBack: () => void; readonly readOnly?: boolean };
type Health = ChannelHealth['channels'][number];
const NO_HEALTH = Promise.resolve(null);

// "Kanallar" for the team (docs/63, G78 sheet 5): each channel one row, the channels the team added
// first, «Kanal qoʻshish» at the bottom. A channel the team added opens to be changed; a main
// channel of the brand opens in Telegram. A channel in trouble says it in red (G75, docs/120). A
// moderator only reads the list: no adding, no editing, no health of the owner.
export function ChannelsScreen({ onBack, readOnly = false }: Props) {
  useScreenView('channels');
  const { t } = useI18n();
  const brand = useBrand();
  const clients = useApiClients();
  const { value, failed, reload, refresh } = useLoad(() => clients.channels.list(), 'channels');
  const [directory, retry] = useDirectory();
  // The health comes from the Cron check; the list never waits for it (G75).
  const health = useLoad(
    () => (readOnly ? NO_HEALTH : clients.team.channelHealth()),
    'manage.channels',
  ).value;
  const [open, setOpen] = useState<Channel | 'new' | null>(null);
  if (failed || directory.status === 'error')
    return <ErrorScreen onRetry={() => (reload(), retry())} onBack={onBack} />;
  if (!value || directory.status !== 'ready') return <ScreenSkeleton onBack={onBack} />;
  if (open)
    return (
      <ChannelEdit
        channel={open === 'new' ? null : open}
        directory={directory.directory}
        onBack={(changed) => {
          setOpen(null);
          if (changed) reload();
        }}
      />
    );
  const trouble = (one: Health | undefined) =>
    one?.canPost === false
      ? t('manage.channel.noPost')
      : one && one.failed > 0
        ? t('manage.channel.failed', { count: one.failed })
        : null;
  const row = (channel: Channel) => {
    const said = trouble(health?.channels.find((one) => one.chat === channel.chat));
    const kind = channel.fixed
      ? t('channels.fixed')
      : t('channels.places', { count: String(channel.places.length) });
    // A private channel of the brand has no public name: its name in Telegram says it (docs/176).
    const state = said ?? kind;
    return (
      <ManageRow
        key={channel.chat}
        icon="channel"
        title={channelName(brand, channel)}
        hint={channel.chat.startsWith('@') ? t('home.meta', { when: channel.chat, more: state }) : state}
        alarm={said !== null}
        onClick={() => (channel.fixed || readOnly ? openInTelegram(channel.link) : setOpen(channel))}
      />
    );
  };
  const team = value.filter((channel) => !channel.fixed);
  return (
    <ManagePage title={t('channels.title')} onBack={onBack} onRefresh={refresh}>
      {value.length === 0 ? <EmptyState icon="channel" title={t('channels.empty')} /> : null}
      {value.length > 0 ? (
        <ManageGroup>{[...team, ...value.filter((channel) => channel.fixed)].map(row)}</ManageGroup>
      ) : null}
      {health ? <ChannelMoves health={health} /> : null}
      {health ? <ChannelReactions health={health} /> : null}
      {readOnly ? null : <MainButton text={t('channels.add')} onClick={() => setOpen('new')} />}
    </ManagePage>
  );
}

// «Kanallar» on the main screen of a moderator (owner decision 06.10.2026, docs/120).
export const ReadChannelsScreen = ({ onBack }: { readonly onBack: () => void }) => (
  <ChannelsScreen onBack={onBack} readOnly />
);
