import { useEffect, useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { FormSheet } from '../sheet/form-sheet';
import { MainButton } from '../telegram/bottom-button';
import './shortfall-sheet.css';
import { useTopUp } from './top-up-link';

// What a confirmation needs: the commission of the seats of one passenger (docs/12).
export type Shortfall = { readonly need: number; readonly seats: number; readonly name: string };
type Props = { readonly shortfall: Shortfall | null; readonly onClose: () => void };

// No money for the commission (G75, mockup g75/4 B, docs/158 Г): one sheet with only the sum short;
// «Hisobni toʻldirish» opens the support chat with the message ready, the driver only sends it.
export function ShortfallSheet({ shortfall, onClose }: Props) {
  const { t } = useI18n();
  return (
    <FormSheet
      open={shortfall !== null}
      title={t('wallet.notEnough.title')}
      {...(shortfall ? { hint: t('wallet.short.for', { name: shortfall.name }) } : {})}
      onClose={onClose}
    >
      {shortfall ? <ShortfallRows shortfall={shortfall} onClose={onClose} /> : null}
    </FormSheet>
  );
}

function ShortfallRows({
  shortfall,
  onClose,
}: {
  readonly shortfall: Shortfall;
  readonly onClose: () => void;
}) {
  useScreenView('wallet.not_enough');
  const { t, formatNumber, formatMoney } = useI18n();
  const { wallet } = useApiClients();
  const topUp = useTopUp();
  const [have, setHave] = useState<number | null>(null);
  useEffect(() => {
    let shown = true;
    wallet.mine().then(
      (mine) => shown && setHave(mine.bonus + mine.main),
      () => shown && setHave(0),
    );
    return () => {
      shown = false;
    };
  }, [wallet]);
  const missing = Math.max(0, shortfall.need - (have ?? 0));
  return (
    <>
      <div className="shortfall-rows">
        <p className="shortfall-row">
          <span>{t('wallet.short.commission', { count: String(shortfall.seats) })}</span>
          <span>{formatNumber(shortfall.need)}</span>
        </p>
        <p className="shortfall-row">
          <span>{t('wallet.card.label')}</span>
          <span>{have === null ? '…' : formatNumber(have)}</span>
        </p>
        <p className="shortfall-row shortfall-missing">
          <span>{t('wallet.short.missing')}</span>
          <span>{formatMoney(missing)}</span>
        </p>
      </div>
      <p className="form-sheet-hint shortfall-note">{t('wallet.short.note')}</p>
      <button type="button" className="form-sheet-link shortfall-later" onClick={onClose}>
        {t('sheet.later')}
      </button>
      <MainButton text={t('wallet.topUp')} onClick={() => topUp(shortfall.name, missing)} />
    </>
  );
}
