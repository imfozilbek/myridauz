import { Text } from '@telegram-apps/telegram-ui';
import { Cell } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile, type Tone } from '../icon-tile';
import type { IconName } from '../icons';
import './way.css';

type Props = {
  readonly icon: IconName;
  readonly tone?: Tone;
  readonly label: string;
  readonly text: string;
  // A point kept from the last trip on the route (G35, docs/97 K4): the map opens only on a tap.
  readonly onChange?: () => void;
};

// One point of a check: what it is, where it is and «Oʻzgartirish» when it can change. The link
// stands under the place, so a 320 px phone keeps the label on one line (G36, docs/100).
export function PointRow({ icon, tone = 'brand', label, text, onChange }: Props) {
  const { t } = useI18n();
  const change = onChange
    ? { description: <Text className="way-change">{t('way.change')}</Text>, onClick: onChange }
    : {};
  return (
    <Cell before={<IconTile name={icon} tone={tone} />} subtitle={text} {...change}>
      {label}
    </Cell>
  );
}
