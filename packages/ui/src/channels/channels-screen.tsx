import type { Channel } from '@platform/contracts';
import { Button, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { useLoad } from '../market/use-list';
import { useDirectory } from '../places/use-directory';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { ChannelEdit } from './channel-edit';
import '../market/market.css';

// "Kanallar" for the team (docs/63): the region channels and the district channels the team added.
// "No channels yet" only when there is none at all, never above a filled list (docs/86 V14).
export function ChannelsScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('channels');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { channels } = useApiClients();
  const { value, failed, reload } = useLoad(() => channels.list());
  const [directory, retry] = useDirectory();
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
  const row = (channel: Channel) => (
    <Cell
      key={channel.username}
      before={<IconTile name="channel" tone={channel.fixed ? 'deep' : 'brand'} />}
      subtitle={`@${channel.username} · ${channel.fixed ? t('channels.fixed') : t('channels.places', { count: String(channel.places.length) })}`}
      {...(channel.fixed ? {} : { onClick: () => setOpen(channel) })}
    >
      {channel.title}
    </Cell>
  );
  const team = value.filter((channel) => !channel.fixed);
  return (
    <div className="market">
      <Screen onBack={onBack} />
      <Title weight="1" className="market-title">
        {t('channels.title')}
      </Title>
      <List>
        {value.length === 0 ? <EmptyState icon="channel" title={t('channels.empty')} /> : null}
        {team.length > 0 ? <Section>{team.map(row)}</Section> : null}
        <div className="step-note">
          <Button size="l" stretched onClick={() => setOpen('new')}>
            {t('channels.add')}
          </Button>
        </div>
        {value.length > team.length ? (
          <Section>{value.filter((channel) => channel.fixed).map(row)}</Section>
        ) : null}
      </List>
    </div>
  );
}
