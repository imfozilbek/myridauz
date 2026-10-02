import { useEffect, useState } from 'react';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { NoticeBanner } from '../notice-banner';
import { useDriver } from './driver-context';
import { approvalSeen, markApprovalSeen } from './approval-seen';

// On the main screen of a driver: while the application is checked, why some things wait;
// once after the approval, that it is approved and the bonus is there (docs/86 V7).
export function DriverNotice() {
  const status = useDriver()?.application.status;
  if (status === 'pending') return <PendingNotice />;
  if (status === 'approved') return <ApprovedNotice />;
  return null;
}

function PendingNotice() {
  const { t } = useI18n();
  return (
    <NoticeBanner
      icon="applications"
      tone="accent"
      title={t('drivers.status.pending.title')}
      text={t('drivers.status.pending.explore')}
    />
  );
}

// Shown on the first visit after the approval; it stays until the driver leaves the screen.
function ApprovedNotice() {
  const { t, formatMoney } = useI18n();
  const { promo } = useBrand();
  const [shown] = useState(() => !approvalSeen());
  useEffect(markApprovalSeen, []);
  if (!shown) return null;
  return (
    <NoticeBanner
      icon="approved"
      tone="brand"
      title={t('drivers.status.approved.title')}
      text={t('drivers.status.approved.bonus', { amount: formatMoney(promo.amount) })}
    />
  );
}
