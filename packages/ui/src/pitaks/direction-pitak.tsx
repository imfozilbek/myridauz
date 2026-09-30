import type { AdminPitak, PitakDirection } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';
import { ErrorScreen } from '../states/error-screen';

type Props = {
  readonly direction: PitakDirection;
  readonly title: string;
  // The pitaks of the region the direction starts from: only they fit it (docs/72).
  readonly pitaks: readonly AdminPitak[];
  readonly onBack: (changed: boolean) => void;
};

const NONE = '';

// The main pitak of one direction: people see it under «Pitakdan» (docs/70).
export function DirectionPitak({ direction, title, pitaks, onBack }: Props) {
  const { t } = useI18n();
  const client = useApiClients().pitaks;
  const [failed, setFailed] = useState(false);
  if (failed) return <ErrorScreen onRetry={() => setFailed(false)} onBack={() => onBack(false)} />;
  const choices = [
    ...pitaks.map((pitak) => ({
      value: pitak.id,
      label: pitak.name,
      after: t(`pitaks.status.${pitak.status}`),
    })),
    { value: NONE, label: t('pitaks.withoutPitak') },
  ];
  const choose = (id: string) =>
    void client.direction({ ...direction, pitakId: id === NONE ? null : id }).then(
      () => onBack(true),
      () => setFailed(true),
    );
  return (
    <ChoiceStep
      screen="pitaks.direction"
      icon="trip"
      title={title}
      header={t('pitaks.chooseHint')}
      choices={choices}
      selected={direction.pitakId ?? NONE}
      onBack={() => onBack(false)}
      onDone={choose}
    />
  );
}
