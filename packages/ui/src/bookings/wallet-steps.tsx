import { TOP_UP_START } from '@platform/contracts';
import { StepLayout } from '../account/step-layout';
import { SupportButton } from '../account/support-button';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';

type NotEnoughProps = { readonly amount: number; readonly onBack: () => void; readonly onTopUp: () => void };

// Without money for the commission there is no confirmation (docs/12): the sum and the way out.
export function NotEnoughScreen({ amount, onBack, onTopUp }: NotEnoughProps) {
  useScreenView('wallet.not_enough');
  const { t, formatMoney } = useI18n();
  return (
    <StepLayout
      icon="wallet"
      title={t('wallet.notEnough.title')}
      hint={t('wallet.notEnough.hint', { amount: formatMoney(amount) })}
    >
      <Screen onBack={onBack} />
      <MainButton text={t('wallet.topUp')} onClick={onTopUp} />
    </StepLayout>
  );
}

// "Hisobni toʻldirish" explains: payments come later, the team adds a bonus by hand (docs/12).
// The main button opens the chat with the team at once (docs/86 V3).
export function TopUpScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('wallet.top_up');
  const { t } = useI18n();
  return (
    <StepLayout icon="wallet" title={t('wallet.topUp.title')} hint={t('wallet.topUp.hint')}>
      <Screen onBack={onBack} />
      <SupportButton start={TOP_UP_START} />
    </StepLayout>
  );
}
