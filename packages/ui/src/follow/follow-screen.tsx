import { ApiError } from '@platform/api-client';
import { SHARE_TOKEN } from '@platform/contracts';
import { Button, Text, Title } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { CellValue } from '../account/cell-value';
import { mapUrl } from '../bookings/map-link';
import { Cell, List, Section } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { PlateView } from '../driver/plate-view';
import { PlacesGate } from '../market/places-gate';
import { RouteView } from '../market/route-view';
import { useLoad } from '../market/use-list';
import { ActionFailure } from '../states/action-failure';
import { EmptyState } from '../states/empty-state';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useFailure } from '../states/use-failure';
import { haptic, openExternal } from '../telegram/feedback';
import { launchParam } from '../telegram/launch-param';
import { requestBotMessages } from '../telegram/permissions';
import { useScreenBackground } from '../telegram/screen-background';
import '../market/market.css';

// The token of a shared trip, when a close person came from the card (docs/43).
export const followToken = () => launchParam('follow', SHARE_TOKEN);

type Props = {
  readonly token: string;
  // "Men ham yoʻlga chiqaman": the close person leaves the card for the registration (docs/18).
  readonly onJoin: () => void;
};

// A close person follows the trip without registration (docs/43): where, when, with whom and how
// it goes. "Xabar olish" lets the bot tell each step.
export function FollowScreen(props: Props) {
  return (
    <PlacesGate>
      <Follow {...props} />
    </PlacesGate>
  );
}

function Follow({ token, onJoin }: Props) {
  useScreenView('share.follow');
  useScreenBackground('grouped');
  const { t, formatDate } = useI18n();
  const { track } = useAnalytics();
  const { chat } = useApiClients();
  const { value, failed } = useLoad(() => chat.sharedTrip(token));
  const [note, setNote] = useState<'follow.subscribed' | 'follow.full' | null>(null);
  const { failure, fail, clear } = useFailure();
  useEffect(() => {
    track({ name: 'share_opened', screen: 'share.follow' });
  }, [track]);
  const join = () => {
    track({ name: 'share_join', screen: 'share.follow' });
    onJoin();
  };
  if (failed) {
    return (
      <>
        <EmptyState icon="trip" title={t('share.follow.closed')} description={t('share.follow.closedHint')} />
        <JoinNote onJoin={join} />
      </>
    );
  }
  if (!value) return <ScreenSkeleton />;
  const subscribe = async () => {
    await requestBotMessages();
    clear();
    try {
      await chat.follow(token);
      track({ name: 'share_follow', screen: 'share.follow' });
      haptic.success();
      setNote('follow.subscribed');
    } catch (caught) {
      // Five people already follow: the note says so and the button goes, a new try cannot help.
      if (caught instanceof ApiError && caught.code === 'shares.too_many') {
        haptic.error();
        setNote('follow.full');
      } else fail(caught);
    }
  };
  const { driver, meetingPoint } = value;
  return (
    <div className="market">
      <Title weight="1" className="market-title">
        {t('share.follow.title', { name: value.passengerName })}
      </Title>
      <Text className="market-subtitle">{formatDate(new Date(value.departAt))}</Text>
      <List>
        <Section>
          <div className="route-summary">
            <RouteView from={value.from} to={value.to} departAt={value.departAt} km={value.km} />
          </div>
          <Cell after={<CellValue>{t(`share.follow.status.${value.status}`)}</CellValue>}>
            {t('share.follow.status')}
          </Cell>
        </Section>
        <Section header={t('share.follow.driver')}>
          <Cell
            subtitle={`${driver.car.make} ${driver.car.model}, ${t(`drivers.color.${driver.car.color}`)}`}
          >
            {driver.firstName}
          </Cell>
          {value.plate ? (
            <Cell description={<PlateView plate={value.plate} small />}>{t('share.follow.plate')}</Cell>
          ) : null}
          {meetingPoint ? (
            <Cell onClick={() => openExternal(mapUrl(meetingPoint))} subtitle={t('bookings.openMap')}>
              {t('share.follow.meeting')}
            </Cell>
          ) : null}
        </Section>
        <ActionFailure error={failure} />
      </List>
      <div className="step-note">
        {note ? (
          <Text className="step-hint">{t(`share.${note}`)}</Text>
        ) : (
          <>
            <Button size="l" stretched onClick={() => void subscribe()}>
              {t('share.follow.subscribe')}
            </Button>
            <Text className="step-hint">{t('share.follow.subscribeHint')}</Text>
          </>
        )}
      </div>
      <JoinNote onJoin={join} />
    </div>
  );
}

function JoinNote({ onJoin }: { readonly onJoin: () => void }) {
  const { t } = useI18n();
  return (
    <div className="step-note">
      <Button mode="plain" size="l" stretched onClick={onJoin}>
        {t('share.follow.join')}
      </Button>
      <Text className="step-hint">{t('share.follow.joinHint')}</Text>
    </div>
  );
}
