import { useState, type ComponentType } from 'react';
import { ChannelsScreen } from '../channels/channels-screen';
import { CompanyScreen } from '../company/company-screen';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { TeamTripsScreen } from '../market/team-trips-screen';
import { PitaksScreen } from '../pitaks/pitaks-screen';
import { PricingScreen } from '../pricing/pricing-screen';
import { SoundsScreen } from '../sounds/sounds-screen';
import { linkedStats, StatsScreen } from '../stats/stats-screen';
import { TeamWalletsScreen } from '../wallet/team-wallets-screen';
import { JournalScreen } from './journal-screen';
import { LimitsScreen } from './limits-screen';
import { ManageGroup, ManagePage, ManageRow } from './manage-page';
import { useManagementHints } from './management-hints';
import { PeopleScreen } from './people-screen';
import { TeamScreen } from './team-screen';

type Back = { readonly onBack: () => void };
const SCREENS = {
  people: PeopleScreen,
  trips: TeamTripsScreen,
  wallets: TeamWalletsScreen,
  pricing: PricingScreen,
  channels: ChannelsScreen,
  pitaks: PitaksScreen,
  team: TeamScreen,
  limits: LimitsScreen,
  journal: JournalScreen,
  company: CompanyScreen,
  sounds: SoundsScreen,
} satisfies Record<string, ComponentType<Back>>;
type Open = 'menu' | 'statistics' | keyof typeof SCREENS;

// «Boshqaruv» of the owner in 4 groups (G75, docs/120, mockup g67/2 screen 6): people and trips,
// money, places, and Rida itself; «Cheklovlar» and «Jurnal» go last, after the rows of the mockup. A moderator never opens it: the server refuses the changes too.
export function ManagementScreen({ onBack }: Back) {
  useScreenView('management');
  const { t } = useI18n();
  const brand = useBrand();
  const linked = linkedStats();
  const [open, setOpen] = useState<Open>(linked ? 'statistics' : 'menu');
  const hints = useManagementHints();
  const menu = () => setOpen('menu');
  if (open === 'statistics') return <StatsScreen onBack={menu} period={linked ?? 'day'} />;
  if (open !== 'menu') {
    const Section = SCREENS[open];
    return <Section onBack={menu} />;
  }
  return (
    <ManagePage title={t('common.admin.management')} hint={t('manage.ownerOnly')} onBack={onBack}>
      <ManageGroup title={t('manage.group.people')}>
        <ManageRow
          icon="passengers"
          title={t('manage.people')}
          hint={t('manage.peopleHint')}
          onClick={() => setOpen('people')}
        />
        <ManageRow
          icon="carSide"
          title={t('common.admin.trips')}
          hint={hints.trips}
          onClick={() => setOpen('trips')}
        />
      </ManageGroup>
      <ManageGroup title={t('manage.group.money')}>
        <ManageRow
          icon="price"
          title={t('wallet.team.title')}
          hint={hints.wallets}
          onClick={() => setOpen('wallets')}
        />
        <ManageRow
          icon="statistics"
          title={t('pricing.title')}
          hint={t('manage.pricingHint')}
          onClick={() => setOpen('pricing')}
        />
      </ManageGroup>
      <ManageGroup title={t('manage.group.places')}>
        <ManageRow
          icon="channel"
          title={t('channels.title')}
          hint={hints.channels}
          onClick={() => setOpen('channels')}
        />
        <ManageRow
          icon="place"
          title={t('pitaks.title')}
          hint={hints.pitaks}
          onClick={() => setOpen('pitaks')}
        />
      </ManageGroup>
      <ManageGroup title={brand.name}>
        <ManageRow
          icon="statistics"
          title={t('common.admin.statistics')}
          hint={t('manage.statisticsHint')}
          onClick={() => setOpen('statistics')}
        />
        <ManageRow
          icon="passengers"
          title={t('manage.team')}
          hint={hints.team}
          onClick={() => setOpen('team')}
        />
        <ManageRow icon="file" title={t('manage.company')} onClick={() => setOpen('company')} />
        <ManageRow icon="sounds" title={t('common.admin.sounds')} onClick={() => setOpen('sounds')} />
        <ManageRow
          icon="locked"
          title={t('manage.limits')}
          hint={t('manage.limitsHint')}
          onClick={() => setOpen('limits')}
        />
        <ManageRow
          icon="history"
          title={t('manage.journal')}
          hint={t('manage.journalHint')}
          onClick={() => setOpen('journal')}
        />
      </ManageGroup>
    </ManagePage>
  );
}
