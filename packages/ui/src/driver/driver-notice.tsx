import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useBrand } from '../context/brand-context';
import { HomeNote } from '../home/home-note';
import { ApplicationCard } from './application-card';
import { useDriver } from './driver-context';
import { approvalSeen, markApprovalSeen } from './approval-seen';

// On the main screen of a driver: before sending, the application to fill (G34); while it is
// checked, why some things wait (docs/86 V7).
export function DriverNotice() {
  const driver = useDriver();
  const status = driver?.application.status;
  if (driver && status === 'draft') return <ApplicationCard driver={driver} />;
  if (status === 'pending') return <PendingNotice />;
  return null;
}

// Once after the approval, that it is approved and the bonus is there (docs/86 V7). Under the
// actions: it waits for the wallet, and when it comes nothing above it moves (G41, docs/108).
export function DriverApproved() {
  return useDriver()?.application.status === 'approved' ? <ApprovedNotice /> : null;
}

// In the colors of the driver app, with a clock, as long as the check lasts: no «Yopish» (G53).
function PendingNotice() {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  return (
    <HomeNote
      icon="waiting"
      ink={colors.brandDeep}
      soft={colors.brandSoft}
      mark={colors.brandStrong}
      title={t('home.check.title')}
      text={t('home.check.text')}
    />
  );
}

// Shown on the first visit after the approval; it stays until the driver leaves the screen. The
// bonus and its last day come from the wallet: a driver approved again has none (docs/89 D4).
function ApprovedNotice() {
  const { t, formatMoney, formatDate } = useI18n();
  const { wallet } = useApiClients();
  const { colors } = useBrand().theme;
  const [shown] = useState(() => !approvalSeen());
  // null until the wallet answers: the banner comes whole, it never grows and pushes the trips (G41).
  const [bonus, setBonus] = useState<string | null>(null);
  useEffect(markApprovalSeen, []);
  useEffect(() => {
    if (!shown) return;
    wallet.mine().then(
      (mine) =>
        mine.bonus > 0 && mine.bonusExpiresAt !== null
          ? setBonus(
              t('drivers.status.approved.bonus', {
                amount: formatMoney(mine.bonus),
                date: formatDate(new Date(mine.bonusExpiresAt)),
              }),
            )
          : setBonus(''),
      () => setBonus(''),
    );
  }, [shown, wallet]);
  if (!shown || bonus === null) return null;
  return (
    <HomeNote
      icon="approved"
      ink={colors.success}
      soft={colors.successSoft}
      mark={colors.success}
      title={t('drivers.status.approved.title')}
      text={bonus}
      closable
    />
  );
}
