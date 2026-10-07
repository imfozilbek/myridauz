import { Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { TeamTripsScreen } from '../market/team-trips-screen';
import { TeamWalletsScreen } from '../wallet/team-wallets-screen';
import { linkedStats, StatsScreen } from '../stats/stats-screen';
import { ChannelsScreen } from '../channels/channels-screen';
import { PitaksScreen } from '../pitaks/pitaks-screen';
import { CompanyScreen } from '../company/company-screen';
import { SoundsScreen } from '../sounds/sounds-screen';
import { PricingScreen } from './pricing-screen';
import '../market/market.css';

type Open =
  'menu' | 'trips' | 'pricing' | 'wallets' | 'channels' | 'pitaks' | 'statistics' | 'company' | 'sounds';

// The third action of the admin Mini App: at most 3 actions on the main screen (docs/19).
export function ManagementScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('management');
  useScreenBackground();
  const { t } = useI18n();
  const linked = linkedStats();
  const [open, setOpen] = useState<Open>(linked ? 'statistics' : 'menu');
  const menu = () => setOpen('menu');
  if (open === 'trips') return <TeamTripsScreen onBack={menu} />;
  if (open === 'pricing') return <PricingScreen onBack={menu} />;
  if (open === 'wallets') return <TeamWalletsScreen onBack={menu} />;
  if (open === 'channels') return <ChannelsScreen onBack={menu} />;
  if (open === 'pitaks') return <PitaksScreen onBack={menu} />;
  if (open === 'company') return <CompanyScreen onBack={menu} />;
  if (open === 'sounds') return <SoundsScreen onBack={menu} />;
  if (open === 'statistics') return <StatsScreen onBack={menu} period={linked ?? 'day'} />;
  return (
    <div className="market">
      <Screen onBack={onBack} />
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
            onClick={() => setOpen('channels')}
          >
            {t('channels.title')}
          </Cell>
          <Cell
            before={<IconTile name="pickup" />}
            subtitle={t('pitaks.hint')}
            onClick={() => setOpen('pitaks')}
          >
            {t('pitaks.title')}
          </Cell>
          <Cell
            before={<IconTile name="statistics" tone="deep" />}
            subtitle={t('common.admin.statisticsHint')}
            onClick={() => setOpen('statistics')}
          >
            {t('common.admin.statistics')}
          </Cell>
          <Cell
            before={<IconTile name="document" />}
            subtitle={t('legal.admin.hint')}
            onClick={() => setOpen('company')}
          >
            {t('legal.admin.title')}
          </Cell>
          <Cell
            before={<IconTile name="sounds" />}
            subtitle={t('common.admin.soundsHint')}
            onClick={() => setOpen('sounds')}
          >
            {t('common.admin.sounds')}
          </Cell>
        </Section>
      </List>
    </div>
  );
}
