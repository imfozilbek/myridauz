import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useBrand } from '../context/brand-context';
import { HomeNote } from '../home/home-note';
import { MainTile } from '../flow/main-tile';
import { useDriver } from './driver-context';
import { approvalSeen, markApprovalSeen } from './approval-seen';

// On the main screen of a driver: before sending, the big tile of the application (G62); while it is
// checked, why some things wait (docs/86 V7); a fix asked, the note that opens it.
export function DriverNotice() {
  const { t } = useI18n();
  const driver = useDriver();
  const status = driver?.application.status;
  if (driver && status === 'draft')
    return (
      <MainTile
        icon="car"
        title={t('drivers.become.title')}
        hint={t('drivers.become.hint')}
        onClick={driver.editCar}
      />
    );
  if (status === 'pending') return <PendingNotice />;
  if (driver && status === 'changes_requested') return <FixNotice onOpen={driver.editCar} />;
  return null;
}

const FIX_TINT = '8%';

// «Назад» out of a fix leaves this note: a tap opens the fix again (docs/94 B4).
function FixNotice({ onOpen }: { readonly onOpen: () => void }) {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  return (
    <button type="button" className="home-note-button" onClick={onOpen}>
      <HomeNote
        icon="error"
        ink={colors.dangerText}
        soft={`color-mix(in srgb, ${colors.danger} ${FIX_TINT}, ${colors.bg})`}
        mark={colors.dangerText}
        title={t('drivers.status.changes_requested.title')}
        text={t('drivers.status.fixHint')}
      />
    </button>
  );
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
