import { BALANCES, type Adjustment, type BalanceKind } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { Cell, Input, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';

const REASON_MIN = 3;
type Props = {
  readonly error: string | null;
  readonly onBack: () => void;
  readonly onSave: (adjustment: Adjustment) => void;
};

// A hand correction by an owner (docs/12): which balance, a sum (minus takes away), a reason.
export function AdjustForm({ error, onBack, onSave }: Props) {
  useScreenView('wallet.adjust');
  const { t } = useI18n();
  const [balance, setBalance] = useState<BalanceKind>('bonus');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const sum = Number(amount);
  const ready = Number.isInteger(sum) && sum !== 0 && reason.trim().length >= REASON_MIN;
  return (
    <StepLayout icon="wallet" title={t('wallet.adjust.title')} hint={t('wallet.adjust.hint')}>
      <BackButton onClick={onBack} />
      <List>
        <Section>
          {BALANCES.map((kind) => (
            <Cell
              key={kind}
              onClick={() => setBalance(kind)}
              after={kind === balance ? <Icon name="selected" /> : null}
            >
              {t(`wallet.${kind}`)}
            </Cell>
          ))}
        </Section>
        {/* The labels are section headers: they wrap, a field header is cut on a 360 px phone (G27). */}
        <Section header={t('wallet.adjust.amount')}>
          <Input
            aria-label={t('wallet.adjust.amount')}
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </Section>
        <Section header={t('wallet.adjust.reason')}>
          <Input
            aria-label={t('wallet.adjust.reason')}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Section>
      </List>
      {error ? <Text className="step-error">{error}</Text> : null}
      {ready ? (
        <MainButton text={t('wallet.adjust.save')} onClick={() => onSave({ balance, amount: sum, reason })} />
      ) : null}
    </StepLayout>
  );
}
