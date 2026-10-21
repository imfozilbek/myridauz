import type { WaitlistEntry, WaitlistRole } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { FormSheet } from '../sheet/form-sheet';
import { painKey, WaitlistCell } from './parts';

// The pains in one line, as one sentence: the names after the first start small (mockup 3-result).
const lowerAfterFirst = (name: string, index: number) =>
  index === 0 ? name : `${name.charAt(0).toLocaleLowerCase()}${name.slice(1)}`;

// What the sheet changes: one answer of the record, or the record of the other role (docs/181).
export type EditChoice = 'pains' | 'route' | 'when' | 'other';

type Props = {
  readonly open: boolean;
  readonly entry: WaitlistEntry;
  readonly route: string;
  // The record of the other role when there is one: the row opens it instead of a new questionnaire.
  readonly other: { readonly role: WaitlistRole; readonly route: string } | null;
  // The list takes new records: closed by the owner, no record of the other role (G91 DRV-9).
  readonly listOpen: boolean;
  readonly onPick: (choice: EditChoice) => void;
  readonly onClose: () => void;
};

// «Oʻzgartirish» (mockup 3-result, screen 4): the pains, the route, «Qachon», the other role.
// No «Roʻyxatdan chiqish»: the general deletion of the data removes the record (owner, 14.10.2026).
export function EditSheet({ open, entry, route, other, listOpen, onPick, onClose }: Props) {
  const { t } = useI18n();
  const cadence = t(`waitlist.cadence.${entry.cadence}`);
  const otherRole: WaitlistRole = entry.role === 'driver' ? 'passenger' : 'driver';
  return (
    <FormSheet
      open={open}
      grouped
      title={t('waitlist.edit.title')}
      hint={`${route} · ${cadence.toLowerCase()}`}
      onClose={onClose}
    >
      <div className="wl-card">
        <WaitlistCell
          icon="painChats"
          title={t('waitlist.edit.pains')}
          hint={entry.pains
            .map((pain, index) => lowerAfterFirst(t(painKey('pain', entry.role, pain)), index))
            .join(', ')}
          onClick={() => onPick('pains')}
        />
        <WaitlistCell
          icon="trip"
          title={t('waitlist.edit.route')}
          hint={route}
          onClick={() => onPick('route')}
        />
        <WaitlistCell
          icon="cadenceMonthly"
          title={t('waitlist.edit.when')}
          hint={cadence}
          onClick={() => onPick('when')}
        />
        {other || listOpen ? (
          <WaitlistCell
            icon={otherRole === 'driver' ? 'car' : 'profile'}
            title={other ? t(`waitlist.role.${other.role}`) : t(`waitlist.edit.${otherRole}`)}
            hint={other ? other.route : t(`waitlist.edit.${otherRole}Hint`)}
            onClick={() => onPick('other')}
          />
        ) : null}
      </div>
    </FormSheet>
  );
}
