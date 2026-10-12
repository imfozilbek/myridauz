import type { TranslationKey } from '@platform/i18n';
import { useState } from 'react';
import { SegmentedControl } from '../components';
import { useI18n } from '../context/i18n-context';
import { haptic } from '../telegram/feedback';

// The whole hours or the half hours, switched on the sheet (owner decisions 12.10.2026).
type Kind = 'whole' | 'half';
const ENDS: Record<Kind, string> = { whole: ':00', half: ':30' };
const TITLES: Record<Kind, TranslationKey> = {
  whole: 'market.when.wholeHours',
  half: 'market.when.halfHours',
};
const KINDS: readonly Kind[] = ['whole', 'half'];
const kindOf = (slot: string | null): Kind => (slot?.endsWith(ENDS.half) ? 'half' : 'whole');

type Props = {
  readonly allowed: readonly string[];
  readonly time: string | null;
  readonly onTime: (time: string) => void;
};

// The times the driver may leave at as tiles, six in a row (G75, mockup g75/3 A phone 1): only the
// free ones, the whole hours or the half hours by the switch over them; it opens on the kind of the
// chosen time and shows only while both kinds have a free time (owner decisions 12.10.2026).
export function TimeGrid({ allowed, time, onTime }: Props) {
  const { t } = useI18n();
  const [picked, setPicked] = useState<Kind>(() => kindOf(time));
  const free = (kind: Kind) => allowed.filter((slot) => slot.endsWith(ENDS[kind]));
  const both = KINDS.every((kind) => free(kind).length > 0);
  const kind = both || free(picked).length > 0 ? picked : picked === 'whole' ? 'half' : 'whole';
  return (
    <>
      {both ? (
        <div className="time-kinds">
          <SegmentedControl>
            {KINDS.map((one) => (
              <SegmentedControl.Item
                key={one}
                selected={one === kind}
                className={one === kind ? 'time-kind-on' : undefined}
                onClick={() => setPicked(one)}
              >
                {t(TITLES[one])}
              </SegmentedControl.Item>
            ))}
          </SegmentedControl>
        </div>
      ) : null}
      <div className="time-grid">
        {free(kind).map((slot) => (
          <button
            key={slot}
            type="button"
            className="time-cell"
            aria-pressed={slot === time}
            onClick={() => {
              haptic.select();
              onTime(slot);
            }}
          >
            {slot}
          </button>
        ))}
      </div>
    </>
  );
}
