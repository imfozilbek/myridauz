import type { Complaint, ComplaintRefund, RefundAnswer } from '@platform/contracts';
import { Cell, Section } from '../components';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { useLoad } from '../market/use-list';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { haptic } from '../telegram/feedback';

type Props = { readonly complaint: Complaint; readonly onDone: () => void };

// The refund of a no-show after the decision (docs/35, G63): its sum; only the owner confirms or
// rejects it, a moderator sees that it waits for the owner.
export const RefundSection = ({ complaint, onDone }: Props) =>
  complaint.refund ? <Refund id={complaint.id} refund={complaint.refund} onDone={onDone} /> : null;

type RefundProps = { readonly id: string; readonly refund: ComplaintRefund; readonly onDone: () => void };

function Refund({ id, refund, onDone }: RefundProps) {
  const { t, formatMoney } = useI18n();
  const { track } = useAnalytics();
  const { feedback, moderation } = useApiClients();
  const { value: me } = useLoad(() => moderation.me(), 'home.me');
  const { failure, fail, clear } = useFailure();
  const answer = async (choice: RefundAnswer) => {
    clear();
    try {
      await feedback.answerRefund(id, choice);
      track({ name: 'complaint_decided', screen: 'complaints.refund' });
      haptic.success();
      onDone();
    } catch (caught) {
      fail(caught);
    }
  };
  const asks = refund.state === 'proposed' && me?.role === 'owner';
  const note =
    refund.state === 'proposed'
      ? me && !asks
        ? t('complaints.refundWaiting')
        : undefined
      : t(refund.state === 'confirmed' ? 'complaints.refundConfirmed' : 'complaints.refundRejected');
  return (
    <>
      <Section header={t('complaints.refundTitle')} footer={note}>
        <Cell before={<IconTile name="wallet" />}>
          {t('complaints.refundAmount', { amount: formatMoney(refund.amount) })}
        </Cell>
        {asks ? (
          <>
            <Cell before={<IconTile name="approved" />} onClick={() => void answer('confirm')}>
              {t('complaints.refundConfirm')}
            </Cell>
            <Cell before={<IconTile name="close" tone="deep" />} onClick={() => void answer('reject')}>
              {t('complaints.refundReject')}
            </Cell>
          </>
        ) : null}
      </Section>
      <ActionFailure error={failure} />
    </>
  );
}
