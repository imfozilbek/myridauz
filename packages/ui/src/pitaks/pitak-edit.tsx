import { PITAK_HINT_MAX, PITAK_STATUSES, type AdminPitak, type Point } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { Cell, Field, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { errorKey } from '../market/error-text';
import type { PlaceDirectory } from '../places/directory';
import { Screen } from '../screen/screen';
import { useUnsavedGuard } from '../screen/unsaved-guard';
import { MainButton } from '../telegram/bottom-button';
import { PointScreen } from '../way/point-screen';
import { useNameText } from '../way/way-end';

const POINT_TITLE: TranslationKey = 'pitaks.pointHint';

type Props = {
  readonly pitak: AdminPitak | null;
  // Where the map opens for a new pitak.
  readonly start: Point;
  readonly directory: PlaceDirectory;
  readonly onBack: (changed: boolean) => void;
};

// One pitak of the team (docs/72): its name, where exactly to stand (G76), its point on the map and
// its status. The region
// comes from the point on the server, nobody types it.
export function PitakEdit({ pitak, start, directory, onBack }: Props) {
  useScreenView('pitaks.edit');
  const { t } = useI18n();
  const { pitaks } = useApiClients();
  const nameText = useNameText();
  const [name, setName] = useState(pitak?.name ?? '');
  const [hint, setHint] = useState(pitak?.hint ?? '');
  const [point, setPoint] = useState<Point | null>(pitak?.point ?? null);
  const [where, setWhere] = useState<string | null>(null);
  const [status, setStatus] = useState(pitak?.status ?? 'candidate');
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const guard = useUnsavedGuard(
    name !== (pitak?.name ?? '') ||
      hint !== (pitak?.hint ?? '') ||
      point !== (pitak?.point ?? null) ||
      status !== (pitak?.status ?? 'candidate'),
  );
  if (picking)
    return (
      <PointScreen
        title={POINT_TITLE}
        start={point ?? start}
        find={directory.find}
        onBack={() => setPicking(false)}
        onPick={(end) => {
          setPoint(end.point);
          setWhere(nameText(end.name, end.place));
          setPicking(false);
        }}
      />
    );
  const save = () => {
    if (!point) return;
    const input = { name, hint, point, status };
    void (pitak ? pitaks.change(pitak.id, input) : pitaks.add(input)).then(
      () => onBack(true),
      (failure: unknown) => setError(failure),
    );
  };
  const region = pitak ? directory.find(pitak.regionId)?.name : undefined;
  return (
    <StepLayout icon="pickup" title={pitak ? pitak.name : t('pitaks.add')}>
      <Screen onBack={guard(() => onBack(false))} />
      <List>
        <Field label={t('pitaks.name')} value={name} onChange={(e) => setName(e.target.value)} />
        <Field
          label={t('pitaks.hint')}
          value={hint}
          maxLength={PITAK_HINT_MAX}
          onChange={(e) => setHint(e.target.value)}
        />
        <Section>
          <Cell
            before={<Icon name="pickup" />}
            subtitle={where ?? (point ? region : t('pitaks.pointNone'))}
            onClick={() => setPicking(true)}
          >
            {t('pitaks.point')}
          </Cell>
        </Section>
        <Section header={t('pitaks.status')}>
          {PITAK_STATUSES.map((one) => (
            <Cell
              key={one}
              {...(one === status ? { after: <Icon name="selected" /> } : {})}
              onClick={() => setStatus(one)}
            >
              {t(`pitaks.status.${one}`)}
            </Cell>
          ))}
        </Section>
      </List>
      {error ? <Text className="step-error">{t(errorKey(error))}</Text> : null}
      {point && name.trim().length > 1 ? <MainButton text={t('pitaks.save')} onClick={save} /> : null}
    </StepLayout>
  );
}
