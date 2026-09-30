import { kmBetween, PICKUP_MODES, type Pitak, type PickupMode, type Point } from '@platform/contracts';
import { Caption, Text } from '@telegram-apps/telegram-ui';
import { Cell, SegmentedControl, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { ROAD_KM, useNameText, type WayEnd } from './way-end';

type Props = {
  readonly from: WayEnd | null;
  readonly to: WayEnd | null;
  readonly mode: PickupMode;
  // Undefined while the direction is not known yet; null when it has no pitak (docs/70).
  readonly pitak: Pitak | null | undefined;
  readonly here: boolean;
  readonly onPick: (end: 'from' | 'to') => void;
  readonly onMode: (mode: PickupMode) => void;
};

const km = (a: Point, b: Point) => Math.round(kmBetween(a, b) * ROAD_KM);

// The card over the map (docs/71): the start and the end, the way of pickup under them.
export function WayCard({ from, to, mode, pitak, here, onPick, onMode }: Props) {
  const { t } = useI18n();
  const nameText = useNameText();
  const field = (end: WayEnd | null, empty: string, hint?: string) =>
    end
      ? { title: nameText(end.name, end.place), subtitle: hint ?? end.place.name }
      : { title: empty, subtitle: undefined };
  const a = field(from, t('way.fromEmpty'), here ? t('way.here') : undefined);
  const b = field(to, t('way.toEmpty'));
  const modes = PICKUP_MODES.filter((each) => each === 'door' || Boolean(pitak));
  const toPitak = pitak && from?.point ? km(from.point, pitak.point) : null;
  return (
    <div className="way-card">
      <Section>
        <Cell before={<IconTile name="origin" />} subtitle={a.subtitle} onClick={() => onPick('from')}>
          {a.title}
        </Cell>
        <Cell
          before={<IconTile name="destination" tone="accent" />}
          subtitle={b.subtitle}
          onClick={() => onPick('to')}
        >
          {b.title}
        </Cell>
      </Section>
      <Text weight="2" className="way-card-label">
        {t('way.mode.title')}
      </Text>
      <SegmentedControl>
        {modes.map((each) => (
          <SegmentedControl.Item key={each} selected={each === mode} onClick={() => onMode(each)}>
            {t(`way.mode.${each}`)}
          </SegmentedControl.Item>
        ))}
      </SegmentedControl>
      {pitak && mode !== 'door' ? (
        <Caption className="way-card-note">
          {toPitak === null ? pitak.name : t('way.pitak', { name: pitak.name, km: String(toPitak) })}
        </Caption>
      ) : null}
      {pitak === null ? <Caption className="way-card-note">{t('way.noPitak')}</Caption> : null}
      {from?.point && to?.point ? (
        <Caption className="way-card-note">{t('way.km', { km: String(km(from.point, to.point)) })}</Caption>
      ) : null}
    </div>
  );
}
