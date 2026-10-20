import type { TranslationKey } from '@platform/i18n';
import { SegmentedControl } from '../components';
import { useI18n } from '../context/i18n-context';

// The whole hours, the half hours (owner decisions 12.10.2026) or a range of whole hours (owner
// decision 20.10.2026, docs/216), switched on the sheet.
export type Kind = 'whole' | 'half' | 'range';
export const KINDS: readonly Kind[] = ['whole', 'half', 'range'];
const TITLES: Record<Kind, TranslationKey> = {
  whole: 'market.when.wholeHours',
  half: 'market.when.halfHours',
  range: 'market.when.range',
};
const HALF = ':30';
export const kindOf = (slot: string | null): Kind => (slot?.endsWith(HALF) ? 'half' : 'whole');
export const ofKind = (slots: readonly string[], kind: Exclude<Kind, 'range'>) =>
  slots.filter((slot) => slot.endsWith(HALF) === (kind === 'half'));

type Props = {
  // Only the kinds with a free time: the switch shows while there are two or more (lesson 248).
  readonly kinds: readonly Kind[];
  readonly kind: Kind;
  readonly onKind: (kind: Kind) => void;
};

// Three buttons get a third of the width each and smaller sides, so «Soat yarimida» fits (mockup g90).
export function TimeKinds({ kinds, kind, onKind }: Props) {
  const { t } = useI18n();
  if (kinds.length < 2) return null;
  return (
    <div className={kinds.length > 2 ? 'time-kinds time-kinds-three' : 'time-kinds'}>
      <SegmentedControl>
        {kinds.map((one) => (
          <SegmentedControl.Item
            key={one}
            selected={one === kind}
            className={one === kind ? 'time-kind-on' : undefined}
            onClick={() => onKind(one)}
          >
            {t(TITLES[one])}
          </SegmentedControl.Item>
        ))}
      </SegmentedControl>
    </div>
  );
}
