import type { Location, Pitak, Point } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useI18n } from '../context/i18n-context';
import { NearChips } from './near-chips';
import { RecentList } from './recent-list';
import { SavedTiles } from './saved-tiles';
import './sheet-places.css';
import type { PointEnd } from './way-end';

type Props = {
  readonly title: TranslationKey;
  // The place under the pin: its name, then the district and the region (docs/121).
  readonly name: string | null;
  readonly area: string | null;
  // A booking: the start offers «Uyim», «Ishxonam», the pitak and «Yaqin joylar»; the end the last places.
  readonly end: 'from' | 'to' | null;
  readonly current: PointEnd | null;
  readonly at: Point | null;
  readonly find: (id: string) => Location | undefined;
  readonly onPick: (end: PointEnd, how: 'recent' | 'saved') => void;
  readonly onMove: (point: Point) => void;
  readonly pitak?: Pitak;
  readonly onPitak?: () => void;
};

// The sheet under the map (docs/126, mockup 9-map-and-preview 1): what the pin points at, then the
// places a person takes without typing.
export function PointSheet(props: Props) {
  const { title, name, area, end, current, at, find, onPick, onMove, pitak, onPitak } = props;
  const { t } = useI18n();
  return (
    <div className="way-sheet">
      <b className="way-sheet-title">{t(title)}</b>
      <p className="way-sheet-place" role="status">
        <b>{name ?? t('way.point.finding')}</b>
        {area ? t('way.point.areaPart', { area }) : null}
      </p>
      {end === 'from' ? (
        <>
          <SavedTiles
            current={current}
            find={find}
            onPick={(picked) => onPick(picked, 'saved')}
            {...(pitak && onPitak ? { pitak, onPitak } : {})}
          />
          <p className="way-sheet-head">{t('way.point.near')}</p>
          <NearChips at={at} onMove={onMove} />
        </>
      ) : (
        <RecentList find={find} onChoose={(picked) => onPick(picked, 'recent')} />
      )}
    </div>
  );
}
