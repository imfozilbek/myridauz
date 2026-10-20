import { ApiError } from '@platform/api-client';
import { SHARE_TOKEN } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { PlacesGate } from '../market/places-gate';
import { useLoad } from '../market/use-list';
import { ActionFailure } from '../states/action-failure';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useFailure } from '../states/use-failure';
import { launchParam, rememberVia } from '../telegram/launch-param';
import { requestBotMessages } from '../telegram/permissions';
import { haptic } from '../telegram/feedback';
import { MainButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { useBrand } from '../context/brand-context';
import { FollowDriver } from './follow-driver';
import { FollowState } from './follow-state';
import './follow.css';

// Close people get no live signals of a trip that is not theirs: the open screen reads the trip
// again each minute (G46, docs/43).
const REFRESH_MS = 60_000;

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
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const { track } = useAnalytics();
  const { chat } = useApiClients();
  // Only a link the server does not know is closed; a bad network shows «Qayta urinish» (G89 U6).
  const [gone, setGone] = useState(false);
  const { value, failed, refresh, reload } = useLoad(() =>
    chat.sharedTrip(token).catch((caught: unknown) => {
      setGone(caught instanceof ApiError && caught.code === 'shares.not_found');
      throw caught;
    }),
  );
  useEffect(() => {
    const timer = setInterval(() => void refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);
  const [note, setNote] = useState<'follow.subscribed' | 'follow.full' | null>(null);
  const { failure, fail, clear } = useFailure();
  useEffect(() => {
    track({ name: 'share_opened', screen: 'share.follow' });
  }, [track]);
  const join = () => {
    track({ name: 'share_join', screen: 'share.follow' });
    rememberVia(value?.via ?? null);
    onJoin();
  };
  if (failed && !gone) return <ErrorScreen onRetry={reload} />;
  if (failed) {
    return (
      <>
        <EmptyState icon="trip" title={t('share.follow.closed')} description={t('share.follow.closedHint')} />
        <JoinNote onJoin={join} />
      </>
    );
  }
  if (!value) return <ScreenSkeleton />;
  const arrived = value.status === 'arrived' || value.status === 'completed';
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
  return (
    <div className="follow" style={brandVars(colors)}>
      <FollowState trip={value} />
      <FollowDriver trip={value} />
      <ActionFailure error={failure} />
      {note ? <p className="follow-note">{t(`share.${note}`)}</p> : null}
      {/* After the arrival nothing is left to follow: only when the link closes (mockup g60/6). */}
      {arrived ? (
        <p className="follow-note follow-ended">{t('share.follow.ended')}</p>
      ) : (
        <JoinNote onJoin={join} />
      )}
      {/* A cancelled trip has no steps for the bot to tell (G90 PAS-11). */}
      {note || arrived || value.status === 'cancelled' ? null : (
        <MainButton text={t('share.follow.subscribe')} onClick={() => void subscribe()} />
      )}
    </div>
  );
}

// «Men ham yoʻlga chiqaman»: the close person leaves the card for the registration (docs/18).
function JoinNote({ onJoin }: { readonly onJoin: () => void }) {
  const { t } = useI18n();
  return (
    <button type="button" className="follow-join" onClick={onJoin}>
      {t('share.follow.join')}
    </button>
  );
}
