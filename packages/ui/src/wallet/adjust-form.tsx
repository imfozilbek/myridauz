import { BALANCES, type Adjustment, type BalanceKind, type Wallet } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { CellValue } from '../account/cell-value';
import { StepLayout } from '../account/step-layout';
import { Cell, Field, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';

const REASON_MIN = 3;
const DIRECTIONS = ['add', 'take'] as const;
type Direction = (typeof DIRECTIONS)[number];
type Props = {
  readonly current: Pick<Wallet, BalanceKind>;
  readonly error: string | null;
  readonly onBack: () => void;
  readonly onSave: (adjustment: Adjustment) => void;
};

// A hand correction by an owner (docs/12): which balance, add or take away, a sum, a reason.
// Adding or taking away is a choice and the new balance shows before saving (docs/86 V2).
export function AdjustForm({ current, error, onBack, onSave }: Props) {
  useScreenView('wallet.adjust');
  const { t, formatMoney } = useI18n();
  const [balance, setBalance] = useState<BalanceKind>('bonus');
  const [direction, setDirection] = useState<Direction | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const sum = Number(amount);
  const valid = direction !== null && Number.isInteger(sum) && sum > 0;
  const signed = direction === 'take' ? -sum : sum;
  const ready = valid && reason.trim().length >= REASON_MIN;
  const choice = <T extends string>(value: T, chosen: T | null, choose: (next: T) => void, label: string) => (
    <Cell
      key={value}
      onClick={() => choose(value)}
      after={value === chosen ? <Icon name="selected" /> : null}
    >
      {label}
    </Cell>
  );
  return (
    <StepLayout icon="wallet" title={t('wallet.adjust.title')} hint={t('wallet.adjust.hint')}>
      <Screen onBack={onBack} />
      <List>
        <Section>{BALANCES.map((kind) => choice(kind, balance, setBalance, t(`wallet.${kind}`)))}</Section>
        <Section>
          {DIRECTIONS.map((each) => choice(each, direction, setDirection, t(`wallet.adjust.${each}`)))}
        </Section>
        <Field
          label={t('wallet.adjust.amount')}
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <Field
          label={t('wallet.adjust.reason')}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        {valid ? (
          <Section>
            <Cell after={<CellValue>{formatMoney(current[balance] + signed)}</CellValue>}>
              {t('wallet.adjust.newBalance')}
            </Cell>
          </Section>
        ) : null}
      </List>
      {error ? <Text className="step-error">{error}</Text> : null}
      {ready ? (
        <MainButton
          text={t('wallet.adjust.save')}
          onClick={() => onSave({ balance, amount: signed, reason })}
        />
      ) : null}
    </StepLayout>
  );
}
