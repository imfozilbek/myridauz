import type { Navbat } from '@platform/contracts';
import { useState } from 'react';
import { useI18n } from '../context/i18n-context';
import type { HomeGo, NavbatFilter } from '../flow/start-action';
import { keepValue, keptValue } from '../screen/list-memory';
import { haptic } from '../telegram/feedback';
import { NavbatChips } from './navbat-chips';
import { NavbatRow } from './navbat-row';
import { TeamSection } from './team-section';
import { NAVBAT_SECTION } from './team-sections';

const FILTER = 'team.navbat.filter';

type SectionProps = {
  readonly navbat: Navbat;
  // The oldest cases that fit one screen with the rest of it; a case leads to the next (mockup g67/1).
  readonly shown: number;
  readonly go: HomeGo;
};

// «Navbat» (docs/120): every case in one list, the oldest first, the filter with the numbers on top.
// A case opens in the filter it was seen, so the next case after a decision is of the same kind.
export function NavbatSection({ navbat, shown, go }: SectionProps) {
  const { t } = useI18n();
  // The filter stays after a case: back on the main screen it is the one the person chose (G77).
  const [filter, setFilter] = useState<NavbatFilter>(() => keptValue<NavbatFilter>(FILTER) ?? 'all');
  const choose = (next: NavbatFilter) => (keepValue(FILTER, next), setFilter(next));
  const items = navbat.items.filter((item) => filter === 'all' || item.kind === filter).slice(0, shown);
  return (
    <TeamSection title={t('team.section.navbat')}>
      <NavbatChips counts={navbat.counts} value={filter} onChange={choose} />
      {items.length === 0 ? (
        <p className="navbat-empty">{t('team.empty')}</p>
      ) : (
        <div className="team-card">
          {items.map((item) => (
            <NavbatRow
              key={`${item.kind}:${item.id}`}
              item={item}
              onOpen={() => {
                haptic.tap();
                go(NAVBAT_SECTION, { navbat: { filter, kind: item.kind, id: item.id } });
              }}
            />
          ))}
        </div>
      )}
    </TeamSection>
  );
}
