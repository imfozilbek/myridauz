import { SegmentedControl } from '../components';
import { useI18n } from '../context/i18n-context';
import '../bookings/past-booking-row.css';

// «Faol» and «Oʻtgan» over «Mening safarlarim» (owner decision 06.10.2026, docs/129, mockups g60/6
// and g64/6): the same two tabs for a passenger and a driver.
export type MineTab = 'live' | 'past';

type Props = {
  readonly tab: MineTab;
  // How many live things the first tab counts: «Faol (3)».
  readonly live: number;
  readonly onTab: (tab: MineTab) => void;
};

export function MineTabs({ tab, live, onTab }: Props) {
  const { t } = useI18n();
  return (
    <div className="market-tabs">
      <SegmentedControl>
        <SegmentedControl.Item
          selected={tab === 'live'}
          className={tab === 'live' ? 'market-tab-on' : undefined}
          onClick={() => onTab('live')}
        >
          {live > 0 ? t('bookings.tab.live', { count: live }) : t('bookings.tab.liveNone')}
        </SegmentedControl.Item>
        <SegmentedControl.Item
          selected={tab === 'past'}
          className={tab === 'past' ? 'market-tab-on' : undefined}
          onClick={() => onTab('past')}
        >
          {t('bookings.tab.past')}
        </SegmentedControl.Item>
      </SegmentedControl>
    </div>
  );
}
