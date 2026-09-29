import type { ComplaintDecision } from '@platform/contracts';
import { useState } from 'react';
import { Cell, Section, Switch } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile, type Tone } from '../icon-tile';
import type { IconName } from '../icons';

type ChoiceKey = 'none' | 'warning' | 'block1' | 'block7' | 'block30' | 'blockForever';
type Props = { readonly noShow: boolean; readonly onDecide: (decision: ComplaintDecision) => void };

// The decisions of docs/17, from the mildest; a no-show may give the driver the commission back.
export function DecisionSection({ noShow, onDecide }: Props) {
  const { t } = useI18n();
  const [refund, setRefund] = useState(false);
  const choices: readonly { key: ChoiceKey; icon: IconName; tone: Tone; decision: ComplaintDecision }[] = [
    { key: 'none', icon: 'selected', tone: 'brand', decision: { action: 'none' } },
    { key: 'warning', icon: 'error', tone: 'accent', decision: { action: 'warning' } },
    { key: 'block1', icon: 'blocked', tone: 'deep', decision: { action: 'block', days: 1 } },
    { key: 'block7', icon: 'blocked', tone: 'deep', decision: { action: 'block', days: 7 } },
    { key: 'block30', icon: 'blocked', tone: 'deep', decision: { action: 'block', days: 30 } },
    { key: 'blockForever', icon: 'blocked', tone: 'deep', decision: { action: 'block', days: null } },
  ];
  return (
    <Section header={t('complaints.decision')}>
      {noShow ? (
        <Cell Component="label" after={<Switch checked={refund} onChange={() => setRefund(!refund)} />}>
          {t('complaints.refund')}
        </Cell>
      ) : null}
      {choices.map((choice) => (
        <Cell
          key={choice.key}
          before={<IconTile name={choice.icon} tone={choice.tone} />}
          onClick={() => onDecide({ ...choice.decision, refund })}
        >
          {t(`complaints.${choice.key}`)}
        </Cell>
      ))}
    </Section>
  );
}
