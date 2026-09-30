import { Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { BackButton } from '../telegram/back-button';
import { useScreenBackground } from '../telegram/screen-background';
import { TeamTripsScreen } from '../market/team-trips-screen';
import { TeamWalletsScreen } from '../wallet/team-wallets-screen';
import { linkedStats, StatsScreen } from '../stats/stats-screen';
import { ChannelsScreen } from '../channels/channels-screen';
import { PricingScreen } from './pricing-screen';
import '../market/market.css';

type Open = 'menu' | 'trips' | 'pricing' | 'wallets' | 'channels' | 'statistics';

// The third action of the admin Mini App: at most 3 actions on the main screen (docs/19).
export function ManagementScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('management');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const linked = linkedStats();
  const [open, setOpen] = useState<Open>(linked ? 'statistics' : 'menu');
  const menu = () => setOpen('menu');
  if (open === 'trips') return <TeamTripsScreen onBack={menu} />;
  if (open === 'pricing') return <PricingScreen onBack={menu} />;
  if (open === 'wallets') return <TeamWalletsScreen onBack={menu} />;
  if (open === 'channels') return <ChannelsScreen onBack={menu} />;
  if (open === 'statistics') return <StatsScreen onBack={menu} period={linked ?? 'day'} />;
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {t('common.admin.management')}
      </Title>
      <List>
        <Section>
          <Cell
            before={<IconTile name="trip" tone="accent" />}
            subtitle={t('common.admin.tripsHint')}
            onClick={() => setOpen('trips')}
          >
            {t('common.admin.trips')}
          </Cell>
          <Cell
            before={<IconTile name="price" />}
            subtitle={t('pricing.hint')}
            multiline
            onClick={() => setOpen('pricing')}
          >
            {t('pricing.title')}
          </Cell>
          <Cell
            before={<IconTile name="wallet" />}
            subtitle={t('wallet.team.hint')}
            onClick={() => setOpen('wallets')}
          >
            {t('wallet.team.title')}
          </Cell>
          <Cell
            before={<IconTile name="channel" />}
            subtitle={t('channels.hint')}
            multiline
            onClick={() => setOpen('channels')}
          >
            {t('channels.title')}
          </Cell>
          <Cell
            before={<IconTile name="statistics" tone="deep" />}
            subtitle={t('common.admin.statisticsHint')}
            onClick={() => setOpen('statistics')}
          >
            {t('common.admin.statistics')}
          </Cell>
        </Section>
      </List>
    </div>
  );
}
