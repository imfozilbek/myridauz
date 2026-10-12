import { BALANCES, type Adjustment, type BalanceKind, type Wallet } from '@platform/contracts';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { ManageChips } from '../manage/manage-chips';
import { ManageInput } from '../manage/manage-input';
import { ManageGroup, ManageNote, ManagePage, ManageRow } from '../manage/manage-page';
import { useUnsavedGuard } from '../screen/unsaved-guard';
import { TeamSection } from '../team/team-section';
import { MainButton } from '../telegram/bottom-button';

const REASON_MIN = 3;
// The ready reasons of a correction (G79 К5): a tap chooses one, «Boshqa» opens the box to type it.
const REASONS = ['bonus', 'noShow', 'mistake', 'payment', 'other'] as const;
type Reason = (typeof REASONS)[number];
const FIRST_BALANCE: BalanceKind = 'bonus';
const DIRECTIONS = ['add', 'take'] as const;
type Direction = (typeof DIRECTIONS)[number];
const DIGITS = /\D/gu;
type Props = {
  readonly current: Pick<Wallet, BalanceKind>;
  readonly error: string | null;
  readonly onBack: () => void;
  readonly onSave: (adjustment: Adjustment) => void;
};

// A hand correction by an owner (docs/12) on one screen (G78 sheet 4): the balance, add or take away
// and the reason are chips, the sum a box; the new balance shows before saving (docs/86 V2).
export function AdjustForm({ current, error, onBack, onSave }: Props) {
  useScreenView('wallet.adjust');
  const { t, formatMoney, formatNumber } = useI18n();
  const [balance, setBalance] = useState<BalanceKind>(FIRST_BALANCE);
  const [direction, setDirection] = useState<Direction | null>(null);
  const [digits, setDigits] = useState('');
  const [chosen, setChosen] = useState<Reason | null>(null);
  const [typed, setTyped] = useState('');
  const reason = chosen === null ? '' : chosen === 'other' ? typed : t(`wallet.adjust.reason.${chosen}`);
  const guard = useUnsavedGuard(
    balance !== FIRST_BALANCE || direction !== null || digits !== '' || chosen !== null,
  );
  const sum = Number(digits);
  const valid = direction !== null && sum > 0;
  const signed = direction === 'take' ? -sum : sum;
  const ready = valid && reason.trim().length >= REASON_MIN;
  return (
    <ManagePage title={t('wallet.adjust.title')} hint={t('wallet.adjust.hint')} onBack={guard(onBack)}>
      <ManageChips
        label={t('wallet.detail.account')}
        chips={BALANCES.map((id) => ({ id, label: t(`wallet.${id}`) }))}
        value={balance}
        onChange={setBalance}
      />
      <ManageChips
        label={t('wallet.adjust.title')}
        chips={DIRECTIONS.map((id) => ({ id, label: t(`wallet.adjust.${id}`) }))}
        value={direction}
        onChange={setDirection}
      />
      <ManageGroup>
        <ManageInput
          label={t('wallet.adjust.amount')}
          value={digits ? formatNumber(sum) : ''}
          mode="numeric"
          onChange={(text) => setDigits(text.replace(DIGITS, ''))}
        />
        {valid ? (
          <ManageRow
            icon="wallet"
            title={t('wallet.adjust.newBalance')}
            value={formatMoney(current[balance] + signed)}
          />
        ) : null}
      </ManageGroup>
      <TeamSection title={t('wallet.adjust.reason')}>
        <ManageChips
          label={t('wallet.adjust.reason')}
          chips={REASONS.map((id) => ({ id, label: t(`wallet.adjust.reason.${id}`) }))}
          value={chosen}
          onChange={setChosen}
          wrap
        />
      </TeamSection>
      {chosen === 'other' ? (
        <ManageGroup>
          <ManageInput label={t('wallet.adjust.reason.other')} value={typed} onChange={setTyped} autoFocus />
        </ManageGroup>
      ) : null}
      {error ? <ManageNote>{error}</ManageNote> : null}
      {ready ? (
        <MainButton
          text={t('wallet.adjust.save')}
          onClick={() => onSave({ balance, amount: signed, reason })}
        />
      ) : null}
    </ManagePage>
  );
}
