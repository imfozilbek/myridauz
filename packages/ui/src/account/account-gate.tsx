import './account.css';
import type { UsersClient } from '@platform/api-client';
import type { MeResponse, MiniApp } from '@platform/contracts';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useFeedChange } from '../feed/feed-context';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { AccountContext, UsersClientContext, type Account } from './account-context';
import { AvatarRequiredScreen } from './avatar-required-screen';
import { BlockedScreen } from './blocked-screen';
import { linkedTrip } from '../market/trip-link';
import { RegistrationFlow, type Welcome } from './registration/registration-flow';
import { TripPreview } from './trip-preview';
import { useBotMessages } from './use-bot-messages';

type AccountGateProps = {
  readonly app: MiniApp;
  readonly client: UsersClient;
  readonly welcome: Welcome;
  readonly children: ReactNode;
};

// Who opens the Mini App decides what they see: registration, the block, or the app (G04).
export function AccountGate({ app, client, welcome, children }: AccountGateProps) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);
  // The trip of a link a new passenger sees before the registration (G75, docs/124 Д).
  const [preview, setPreview] = useState(() => (app === 'passenger' ? linkedTrip() : null));
  const load = useCallback(() => {
    setFailed(false);
    client.getMe().then(setMe, () => setFailed(true));
  }, [client]);
  useEffect(load, [load]);
  // A decision of the team (a block, a new photo rule) shows without a reload (G43, docs/64).
  useFeedChange(() => void client.getMe().then(setMe, () => undefined));
  const onAvatarChanged = useCallback(() => {
    setAvatarVersion((version) => version + 1);
    load();
  }, [load]);

  const account = useMemo<Account | null>(
    () =>
      me?.state === 'active'
        ? {
            app,
            client,
            profile: me.profile,
            avatarVersion,
            onAvatarChanged,
            onProfileChanged: load,
          }
        : null,
    [app, client, me, avatarVersion, onAvatarChanged, load],
  );
  useBotMessages(account);

  const screen = (() => {
    if (failed) return <ErrorScreen onRetry={load} />;
    if (!me) return <ScreenSkeleton />;
    if (me.state === 'blocked') return <BlockedScreen until={me.until} />;
    if (me.state === 'unregistered' && preview)
      return <TripPreview id={preview} onDone={() => setPreview(null)} />;
    if (me.state === 'unregistered')
      return <RegistrationFlow welcome={welcome} suggestedName={me.suggestedName} onFinished={setMe} />;
    // The face is required for both roles (G58, docs/128 §1): a failed upload is asked again here.
    return me.profile.hasAvatar ? children : <AvatarRequiredScreen />;
  })();

  return (
    <UsersClientContext.Provider value={client}>
      <AccountContext.Provider value={account}>{screen}</AccountContext.Provider>
    </UsersClientContext.Provider>
  );
}
