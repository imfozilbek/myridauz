import type { UsersClient } from '@platform/api-client';
import type { MiniApp } from '@platform/contracts';
import type { ComponentType } from 'react';
import { AccountGate } from './account/account-gate';
import type { Welcome } from './account/registration/registration-flow';
import { TeamGate } from './account/team-gate';
import { DriverGate } from './driver/driver-gate';
import { FeedProvider } from './feed/feed-provider';
import { FollowGate } from './follow/follow-gate';
import { MomentGate } from './growth/moment-gate';
import { LaunchLinks } from './launch-links';
import { LegalGate } from './legal/legal-gate';
import { playNotify } from './sounds/brand-sound';
import { onAppVisible } from './telegram/app-visible';

type AppGatesProps = {
  readonly app: MiniApp;
  readonly welcome: Welcome | undefined;
  readonly users: UsersClient;
  // The address of the live channel of the person (docs/64).
  readonly connect: () => Promise<string>;
  readonly Page: ComponentType;
};

// What stands before the page of a Mini App. The questionnaire of the main bot needs no account and
// no live channel (G83, docs/181), only its «/hujjatlar» (G90 BOT-1); the passenger and the driver
// register (G04); the team is checked.
export function AppGates({ app, welcome, users, connect, Page }: AppGatesProps) {
  if (app === 'main')
    return (
      <LegalGate>
        <Page />
      </LegalGate>
    );
  return (
    <FeedProvider connect={connect} onWake={onAppVisible} onSignal={() => playNotify()}>
      {welcome ? (
        // Only the passenger app is opened from a shared trip card (docs/43).
        <FollowGate enabled={app === 'passenger'}>
          <LegalGate>
            <AccountGate app={app} client={users} welcome={welcome}>
              <DriverGate enabled={app === 'driver'}>
                {/* Only a new driver has a moment: none after the registration (owner 18.10.2026). */}
                <MomentGate enabled={app === 'driver'}>
                  <LaunchLinks app={app}>
                    <Page />
                  </LaunchLinks>
                </MomentGate>
              </DriverGate>
            </AccountGate>
          </LegalGate>
        </FollowGate>
      ) : (
        <TeamGate client={users}>
          <Page />
        </TeamGate>
      )}
    </FeedProvider>
  );
}
