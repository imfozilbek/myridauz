import { TASHKENT_CITY, type WaitlistOverview } from '@platform/contracts';
import { useApiClients } from '../../context/api-clients';
import { useI18n } from '../../context/i18n-context';
import { ManageGroup, ManageRow } from '../../manage/manage-page';
import { useLoad } from '../../market/use-list';
import { useDirectory } from '../../places/use-directory';
import { painKey } from '../parts';

// The directions shown on «Statistika»; the rest under «Hammasi».
const TOP = 5;
type Row = WaitlistOverview['directions'][number];

// The words of a direction: «Toshkent shahri ↔ Samarqand viloyati» (docs/181).
export function useRouteName() {
  const { t } = useI18n();
  const [places] = useDirectory();
  const name = (id: string) => (places.status === 'ready' ? (places.directory.find(id)?.name ?? id) : id);
  return (region: string) => t('waitlist.route.pair', { from: name(TASHKENT_CITY), to: name(region) });
}

// One direction: who waits, or «Ochildi · 2-noyabr · Xabar ketdi: 133 kishiga» once it is open.
export function DirectionRow({
  row,
  onOpen,
}: {
  readonly row: Row;
  readonly onOpen: (region: string) => void;
}) {
  const { t, formatDate } = useI18n();
  const route = useRouteName();
  const opened = row.opened;
  const hint = opened
    ? `${t('waitlistTeam.opened', { date: formatDate(new Date(opened.at)) })} · ${t('waitlistTeam.sent', { n: opened.sent })}`
    : t('waitlistTeam.people', { p: row.passengers, d: row.drivers });
  return <ManageRow title={route(row.region)} hint={hint} onClick={() => onOpen(row.region)} />;
}

type Props = { readonly onDirection: (region: string) => void; readonly onAll: () => void };

// «Kutayotganlar» on top of «Statistika» (docs/181, mockup 4-admin): everyone, the main pain of the
// passengers, the directions with the most people first.
export function WaitingBlock({ onDirection, onAll }: Props) {
  const { t, formatNumber } = useI18n();
  const { waitlist } = useApiClients();
  const { value } = useLoad(() => waitlist.overview(), 'waitlist.overview');
  if (!value) return null;
  const { topPain, directions } = value;
  return (
    <ManageGroup title={t('waitlistTeam.waiting')}>
      <ManageRow
        icon="passengers"
        title={t('waitlistTeam.people', {
          p: formatNumber(value.passengers),
          d: formatNumber(value.drivers),
        })}
        hint={t('waitlistTeam.directions', { n: directions.length })}
      />
      {topPain ? (
        <ManageRow
          icon="painChats"
          title={t('waitlistTeam.topPain', { pain: t(painKey('pain', 'passenger', topPain.pain)) })}
          hint={t('waitlistTeam.topPainHint', { share: topPain.share })}
        />
      ) : null}
      {directions.slice(0, TOP).map((row) => (
        <DirectionRow key={row.region} row={row} onOpen={onDirection} />
      ))}
      {directions.length > TOP ? (
        <ManageRow title={t('waitlistTeam.all', { n: directions.length })} onClick={onAll} />
      ) : null}
    </ManageGroup>
  );
}
