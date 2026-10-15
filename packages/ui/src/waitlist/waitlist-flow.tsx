import { TASHKENT_CITY, withVia, type WaitlistEntry, type WaitlistRole } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { useDirectory } from '../places/use-directory';
import { ErrorBoundary } from '../states/error-boundary';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { BackButton } from '../telegram/back-button';
import { openInTelegram } from '../telegram/feedback';
import { launchParam } from '../telegram/launch-param';
import { shareCard } from '../telegram/share-card';
import { ChannelsStep } from './channels-step';
import { ClosedScreen } from './closed-screen';
import { EditSheet, type EditChoice } from './edit-sheet';
import { Questionnaire, type Draft, type Mode } from './questionnaire';
import { ResultScreen } from './result-screen';
import { RoleBrand } from './role-brand';
import { useWaitlist } from './use-waitlist';

type Ask = { readonly mode: Mode; readonly start: Draft };
const NEW: Ask = { mode: 'new', start: { role: null, pains: [], home: null, region: null, cadence: null } };
// «✏️ Oʻzgartirish» and «📣 Yoʻnalish kanali» of the card of the bot open the result on them.
const OPEN = /^(edit|channels)$/u;
const VIA_MAIN = 'main';
const draftOf = ({ role, pains, home, region, cadence }: WaitlistEntry): Draft => ({
  role,
  pains,
  home,
  region,
  cadence,
});

// The Mini App of the main bot (G83, docs/181): the questionnaire for a new person, then «Siz
// roʻyxatdasiz» with its sheet, the channels and a friend's invitation. Closed by the owner: the trips.
// Its own boundary: a broken step shows «Qayta urinish», not the error of the whole app (G52).
export const WaitlistFlow = () => (
  <ErrorBoundary>
    <Waitlist />
  </ErrorBoundary>
);

function Waitlist() {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const brand = useBrand();
  const { waitlist } = useApiClients();
  const { me, failed, retry, save } = useWaitlist();
  const [places, retryPlaces] = useDirectory();
  const [asking, setAsking] = useState<Ask | null>(null);
  const [shown, setShown] = useState<WaitlistRole | null>(null);
  const [sheet, setSheet] = useState(() => launchParam('open', OPEN) === 'edit');
  const [channels, setChannels] = useState(() => launchParam('open', OPEN) === 'channels');
  useEffect(() => {
    track({ name: 'waitlist_step', screen: 'waitlist', step: 'opened' });
  }, [track]);
  if (failed || places.status === 'error') return <ErrorScreen onRetry={() => (retry(), retryPlaces())} />;
  if (!me || places.status !== 'ready') return <ScreenSkeleton />;
  const { directory } = places;
  const route = (region: string) =>
    t('waitlist.route.pair', {
      from: directory.find(TASHKENT_CITY)?.name ?? '',
      to: directory.find(region)?.name ?? '',
    });
  const entry = me.entries.find((one) => one.role === shown) ?? me.entries[0];
  const ask = asking ?? (entry ? null : NEW);
  if (ask && (me.open || ask !== NEW))
    return (
      <Questionnaire
        key={`${ask.mode}-${ask.start.role ?? ''}`}
        mode={ask.mode}
        start={ask.start}
        directory={directory}
        member={me.channels}
        route={route}
        save={(answers) => (setAsking((current) => current ?? ask), save(answers))}
        onDone={(role) => (setAsking(null), setShown(role))}
        onBack={() => setAsking(null)}
      />
    );
  if (!entry)
    return (
      <RoleBrand role={null}>
        <ClosedScreen />
      </RoleBrand>
    );
  const other = me.entries.find((one) => one.role !== entry.role);
  const pick = (choice: EditChoice) => {
    setSheet(false);
    if (choice !== 'other') return setAsking({ mode: choice, start: draftOf(entry) });
    if (other) return setShown(other.role);
    const role = entry.role === 'driver' ? 'passenger' : 'driver';
    return setAsking({ mode: 'second', start: { ...draftOf(entry), role, pains: [], cadence: null } });
  };
  const invite = async () => {
    const invited = await waitlist.invite(entry.role);
    track({ name: 'waitlist_step', screen: 'waitlist_done', step: 'invite_sent', role: entry.role });
    await shareCard(invited.prepared, invited.link);
  };
  return (
    <RoleBrand role={entry.role}>
      {channels ? (
        <>
          <BackButton onClick={() => setChannels(false)} />
          <ChannelsStep
            region={entry.region}
            regionName={directory.find(entry.region)?.name ?? ''}
            member={me.channels}
            onNext={() => setChannels(false)}
          />
        </>
      ) : (
        <ResultScreen
          entry={entry}
          route={route(entry.region)}
          channels={me.channels.length}
          onEdit={() => setSheet(true)}
          onChannels={() => setChannels(true)}
          onInvite={invite}
          onDriver={() =>
            openInTelegram(`https://t.me/${brand.bots.driver}?startapp=${withVia('', VIA_MAIN)}`)
          }
        />
      )}
      <EditSheet
        open={sheet && !channels}
        entry={entry}
        route={route(entry.region)}
        other={other ? { role: other.role, route: route(other.region) } : null}
        onPick={pick}
        onClose={() => setSheet(false)}
      />
    </RoleBrand>
  );
}
