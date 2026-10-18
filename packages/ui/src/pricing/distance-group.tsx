import { MAX_DISTANCE_KM, type Direction } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageRow } from '../manage/manage-page';
import { ManageInput } from '../manage/manage-input';
import { useLoad } from '../market/use-list';
import { FormSheet } from '../sheet/form-sheet';
import { MainButton } from '../telegram/bottom-button';

type Props = { readonly direction: Direction; readonly onSave: (km: number) => void };

// The road km of a direction (G45, docs/48): the owner corrects a wrong one and every price of the
// direction follows; under it, who corrected it, when, before and after.
export function DistanceGroup({ direction, onSave }: Props) {
  const { t, formatDate } = useI18n();
  const { pricing } = useApiClients();
  const { value } = useLoad(() => pricing.distanceHistory(direction.from, direction.to));
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(direction.km === null ? '' : String(direction.km));
  const km = Number(text);
  const fits = Number.isInteger(km) && km >= 1 && km <= MAX_DISTANCE_KM && km !== direction.km;
  return (
    <>
      <ManageGroup title={t('pricing.distance')}>
        <ManageRow
          icon="trip"
          title={
            direction.km === null ? t('pricing.distanceNone') : t('pricing.distanceKm', { km: direction.km })
          }
          hint={t('pricing.distanceHint')}
          onClick={() => setOpen(true)}
        />
        {(value?.changes ?? []).map((change) => (
          <ManageRow
            key={change.at}
            icon="history"
            title={
              change.before === null
                ? t('pricing.distanceKm', { km: change.after })
                : t('pricing.distanceChange', { before: change.before, after: change.after })
            }
            hint={t('pricing.versionBy', { date: formatDate(new Date(change.at)), who: change.by })}
          />
        ))}
      </ManageGroup>
      <FormSheet
        open={open}
        title={t('pricing.distance')}
        hint={t('pricing.distanceHint')}
        onClose={() => setOpen(false)}
      >
        <ManageInput label={t('pricing.distanceField')} value={text} mode="numeric" onChange={setText} />
        <MainButton
          text={t('manage.limitSave')}
          disabled={!fits}
          onClick={() => (setOpen(false), onSave(km))}
        />
      </FormSheet>
    </>
  );
}
