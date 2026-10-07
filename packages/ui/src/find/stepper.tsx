import type { ReactNode } from 'react';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';

type Props = {
  readonly value: ReactNode;
  readonly atLeast: boolean;
  readonly atMost: boolean;
  readonly onStep: (by: -1 | 1) => void;
};

// «−», the value, «+» in a row of a card (G59 «Necha kishi ketadi?», G61 the request): round soft
// buttons of a finger size, the ends dimmed.
export function Stepper({ value, atLeast, atMost, onStep }: Props) {
  const { t } = useI18n();
  return (
    <span className="seats-stepper">
      <button type="button" aria-label={t('market.price.less')} disabled={atLeast} onClick={() => onStep(-1)}>
        <Icon name="less" size={20} />
      </button>
      <span className="seats-count">{value}</span>
      <button type="button" aria-label={t('market.price.more')} disabled={atMost} onClick={() => onStep(1)}>
        <Icon name="more" size={20} />
      </button>
    </span>
  );
}
