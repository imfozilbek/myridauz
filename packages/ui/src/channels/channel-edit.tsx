import type { Channel, Location } from '@platform/contracts';
import { Button, Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { Cell, Field, List, Multiselectable, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { errorKey } from '../market/error-text';
import type { PlaceDirectory } from '../places/directory';
import { Screen } from '../screen/screen';
import { useUnsavedGuard } from '../screen/unsaved-guard';
import { MainButton } from '../telegram/bottom-button';
import { withNear } from './near';

type Props = {
  readonly channel: Channel | null;
  readonly directory: PlaceDirectory;
  readonly onBack: (changed: boolean) => void;
};

// One channel of the team (docs/63): its address, its name and the places whose trips it gets.
export function ChannelEdit({ channel, directory, onBack }: Props) {
  useScreenView('channels.edit');
  const { t } = useI18n();
  const { channels } = useApiClients();
  const [username, setUsername] = useState(channel?.username ?? '');
  const [title, setTitle] = useState(channel?.title ?? '');
  const [places, setPlaces] = useState<readonly string[]>(channel?.places ?? []);
  const [region, setRegion] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const guard = useUnsavedGuard(
    username !== (channel?.username ?? '') ||
      title !== (channel?.title ?? '') ||
      places.join() !== (channel?.places ?? []).join(),
  );
  const toggle = (id: string) =>
    setPlaces((now) => (now.includes(id) ? now.filter((one) => one !== id) : [...now, id]));
  const chosen = places.map(directory.find).filter((place): place is Location => place !== undefined);
  const run = (action: () => Promise<unknown>) =>
    void action().then(
      () => onBack(true),
      (failure: unknown) => setError(failure),
    );
  const save = () => run(() => channels.save(username.replace(/^@/u, ''), { title, places: [...places] }));
  return (
    <StepLayout
      icon="channel"
      title={channel ? channel.title : t('channels.add')}
      hint={t('channels.botHint')}
    >
      <Screen onBack={guard(() => onBack(false))} />
      <List>
        {channel ? null : (
          <Field
            label={t('channels.username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        )}
        <Field label={t('channels.name')} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Section header={t('channels.placesTitle')} footer={t('channels.placesHint')}>
          {chosen.map((place) => (
            <Cell
              key={place.id}
              before={<Multiselectable checked onChange={() => toggle(place.id)} />}
              onClick={() => toggle(place.id)}
            >
              {place.name}
            </Cell>
          ))}
          <Cell onClick={() => setPlaces(withNear(chosen, directory.all))}>{t('channels.near')}</Cell>
        </Section>
        <Section header={t('channels.region')}>
          {directory.regions.map((one) => (
            <Cell key={one.id} onClick={() => setRegion(region === one.id ? null : one.id)}>
              {one.name}
            </Cell>
          ))}
        </Section>
        {region === null ? null : (
          <Section>
            {[directory.find(region), ...directory.inside(region)].map((place) =>
              place ? (
                <Cell
                  key={place.id}
                  before={
                    <Multiselectable checked={places.includes(place.id)} onChange={() => toggle(place.id)} />
                  }
                  onClick={() => toggle(place.id)}
                >
                  {place.name}
                </Cell>
              ) : null,
            )}
          </Section>
        )}
      </List>
      {error ? <Text className="step-error">{t(errorKey(error))}</Text> : null}
      {channel ? (
        <div className="step-note">
          <Button
            mode="plain"
            size="m"
            stretched
            onClick={() => run(() => channels.remove(channel.username))}
          >
            {t('channels.remove')}
          </Button>
        </div>
      ) : null}
      {username && title && places.length > 0 ? (
        <MainButton text={t('channels.save')} onClick={save} />
      ) : null}
    </StepLayout>
  );
}
