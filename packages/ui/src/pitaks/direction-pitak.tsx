import type { AdminPitak, PitakDirection } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManagePage, ManageRow } from '../manage/manage-page';
import { ErrorScreen } from '../states/error-screen';
import { MainButton } from '../telegram/bottom-button';

type Props = {
  readonly direction: PitakDirection;
  readonly title: string;
  // The pitaks of the region the direction starts from: only they fit it (docs/72).
  readonly pitaks: readonly AdminPitak[];
  readonly onBack: (changed: boolean) => void;
};

const NONE = '';

// The main pitak of one direction: people see it under «Pitakdan» (docs/70). Each pitak a row with
// its state, the chosen one marked (G78 sheet 6); a tap on a row saves it at once, «Davom etish»
// keeps the chosen one.
export function DirectionPitak({ direction, title, pitaks, onBack }: Props) {
  useScreenView('pitaks.direction');
  const { t } = useI18n();
  const client = useApiClients().pitaks;
  const chosen = direction.pitakId ?? NONE;
  const [failed, setFailed] = useState(false);
  if (failed) return <ErrorScreen onRetry={() => setFailed(false)} onBack={() => onBack(false)} />;
  const rows = [
    ...pitaks.map((pitak) => ({
      key: pitak.id,
      title: pitak.name,
      hint: t(`pitaks.status.${pitak.status}`),
    })),
    { key: NONE, title: t('pitaks.withoutPitak') },
  ];
  const save = (id: string) =>
    client.direction({ ...direction, pitakId: id === NONE ? null : id }).then(
      () => onBack(true),
      () => setFailed(true),
    );
  return (
    <ManagePage title={title} hint={t('pitaks.chooseHint')} onBack={() => onBack(false)}>
      <ManageGroup>
        {rows.map((row) => {
          const on = row.key === chosen;
          return (
            <ManageRow
              key={row.key}
              icon={on ? 'selected' : 'pickup'}
              {...(on ? { tone: 'success' as const } : {})}
              title={row.title}
              {...('hint' in row ? { hint: row.hint } : {})}
              arrow={false}
              onClick={() => void save(row.key)}
            />
          );
        })}
      </ManageGroup>
      <MainButton text={t('common.continue')} onClick={() => save(chosen)} />
    </ManagePage>
  );
}
