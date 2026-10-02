import './account.css';
import type { UsersClient } from '@platform/api-client';
import type { MeResponse, MiniApp } from '@platform/contracts';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { AccountContext, UsersClientContext, type Account } from './account-context';
import { AvatarRequiredScreen } from './avatar-required-screen';
import { BlockedScreen } from './blocked-screen';
import { RegistrationFlow, type Welcome } from './registration/registration-flow';
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
  const load = useCallback(() => {
    setFailed(false);
    client.getMe().then(setMe, () => setFailed(true));
  }, [client]);
  useEffect(load, [load]);
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
            settings: me.settings,
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
    if (me.state === 'unregistered')
      return <RegistrationFlow welcome={welcome} suggestedName={me.suggestedName} onFinished={setMe} />;
    const photoMissing = app === 'passenger' && me.settings.passengerAvatarRequired && !me.profile.hasAvatar;
    return photoMissing ? <AvatarRequiredScreen /> : children;
  })();

  return (
    <UsersClientContext.Provider value={client}>
      <AccountContext.Provider value={account}>{screen}</AccountContext.Provider>
    </UsersClientContext.Provider>
  );
}
