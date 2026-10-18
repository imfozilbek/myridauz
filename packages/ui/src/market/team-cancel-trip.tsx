import { TEAM_CANCEL_REASON_MAX, teamCancelSchema, type Trip } from '@platform/contracts';
import { useState } from 'react';
import { Textarea } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageRow } from '../manage/manage-page';
import { FormSheet } from '../sheet/form-sheet';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { MainButton } from '../telegram/bottom-button';
import { confirm, haptic } from '../telegram/feedback';

type Props = { readonly trip: Trip; readonly onCancelled: () => void };

// «Safarni bekor qilish» of the team (Q5 of docs/111, G45): only a trip not on the road yet; the
// reason goes to the driver, the passengers hear the team cancelled it, the commission comes back.
// Asked once more: it cannot be undone.
export function TeamCancelTrip({ trip, onCancelled }: Props) {
  const { t } = useI18n();
  const { bookings } = useApiClients();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const { failure, fail, clear } = useFailure();
  const live = (trip.status === 'active' || trip.status === 'full') && trip.departedAt === null;
  if (!live) return null;
  const valid = teamCancelSchema.safeParse({ reason }).success;
  const cancel = async () => {
    clear();
    if (!(await confirm(t('market.teamCancel.ask'), t('market.teamCancel.confirm')))) return;
    try {
      await bookings.cancelTrip(trip.id, { reason: reason.trim() });
      haptic.success();
      setOpen(false);
      onCancelled();
    } catch (caught) {
      fail(caught);
    }
  };
  return (
    <>
      <ManageGroup>
        <ManageRow icon="close" title={t('market.teamCancel.title')} danger onClick={() => setOpen(true)} />
      </ManageGroup>
      <FormSheet
        open={open}
        title={t('market.teamCancel.title')}
        hint={t('market.teamCancel.hint')}
        onClose={() => setOpen(false)}
      >
        <Textarea
          aria-label={t('market.teamCancel.reason')}
          placeholder={t('market.teamCancel.reason')}
          value={reason}
          maxLength={TEAM_CANCEL_REASON_MAX}
          onChange={(event) => setReason(event.target.value)}
        />
        <ActionFailure error={failure} />
        <MainButton
          text={t('market.teamCancel.confirm')}
          destructive
          disabled={!valid}
          onClick={() => void cancel()}
        />
      </FormSheet>
    </>
  );
}
