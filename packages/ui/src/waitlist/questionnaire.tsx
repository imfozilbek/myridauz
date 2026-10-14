import {
  TASHKENT_CITY,
  type Cadence,
  type Pain,
  type WaitlistAnswers,
  type WaitlistRole,
} from '@platform/contracts';
import { useRef, useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import type { PlaceDirectory } from '../places/directory';
import { ActionFailure } from '../states/action-failure';
import { BackButton } from '../telegram/back-button';
import { ChannelsStep } from './channels-step';
import { PainsStep } from './pains-step';
import { RegionStep } from './region-step';
import { RoleBrand } from './role-brand';
import { RoleStep } from './role-step';
import { WhenStep } from './when-step';

type Step = 'role' | 'pains' | 'home' | 'city' | 'when' | 'channels';
// new: the whole questionnaire; second: the other role; the rest: one answer from «Oʻzgartirish».
export type Mode = 'new' | 'second' | 'pains' | 'route' | 'when';
export type Draft = {
  readonly role: WaitlistRole | null;
  readonly pains: readonly Pain[];
  readonly home: string | null;
  readonly region: string | null;
  readonly cadence: Cadence | null;
};
const ORDER: Readonly<Record<Mode, readonly Step[]>> = {
  new: ['role', 'pains', 'home', 'city', 'when', 'channels'],
  second: ['pains', 'home', 'city', 'when'],
  pains: ['pains'],
  route: ['home', 'city'],
  when: ['when'],
};
const stepsOf = (mode: Mode, home: string | null) =>
  ORDER[mode].filter((step) => step !== 'city' || home === TASHKENT_CITY);
const answersOf = ({ role, pains, home, region, cadence }: Draft): WaitlistAnswers | null =>
  role && home && region && cadence ? { role, pains: [...pains], home, region, cadence } : null;

type Props = {
  readonly mode: Mode;
  readonly start: Draft;
  readonly directory: PlaceDirectory;
  readonly member: readonly string[];
  readonly route: (region: string) => string;
  readonly save: (answers: WaitlistAnswers) => Promise<unknown>;
  readonly onDone: (role: WaitlistRole) => void;
  readonly onBack: () => void;
};

// The steps of the questionnaire (docs/181, mockup 2): the answers are saved at «Qachon», so leaving at
// the channels loses nobody (docs/183); every step tells the funnel of its role.
export function Questionnaire({ mode, start, directory, member, route, save, onDone, onBack }: Props) {
  const { track } = useAnalytics();
  const [draft, setDraft] = useState(start);
  const [step, setStep] = useState<Step>(stepsOf(mode, start.home)[0] ?? 'role');
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);
  const tell = (name: 'role' | 'pains' | 'route' | 'when', role = draft.role) =>
    track({ name: 'waitlist_step', screen: `waitlist_${step}`, step: name, ...(role ? { role } : {}) });
  const next = async (patch: Partial<Draft>) => {
    const changed = { ...draft, ...patch };
    setDraft(changed);
    const steps = stepsOf(mode, changed.home);
    const following = steps[steps.indexOf(step) + 1];
    if (following && following !== 'channels') return setStep(following);
    const answers = answersOf(changed);
    if (!answers || busy.current) return undefined;
    busy.current = true;
    try {
      await save(answers);
      setFailed(false);
      return following ? setStep(following) : onDone(answers.role);
    } catch {
      return setFailed(true);
    } finally {
      busy.current = false;
    }
  };
  const back = () => {
    const steps = stepsOf(mode, draft.home);
    const previous = steps[steps.indexOf(step) - 1];
    if (step === 'channels' && draft.role) onDone(draft.role);
    else if (previous) setStep(previous);
    else onBack();
  };
  const role = draft.role ?? 'passenger';
  const pickRegion = (region: string) => {
    if (step === 'home' && region === TASHKENT_CITY) return next({ home: region, region: null });
    tell('route', role);
    return next(step === 'home' ? { home: region, region } : { region });
  };
  return (
    <RoleBrand role={draft.role}>
      {step === 'role' && mode === 'new' ? null : <BackButton onClick={back} />}
      {step === 'role' ? (
        <RoleStep onPick={(picked) => (tell('role', picked), next({ role: picked }))} />
      ) : step === 'pains' ? (
        <PainsStep
          role={role}
          chosen={draft.pains}
          onToggle={(pain) =>
            setDraft({
              ...draft,
              pains: draft.pains.includes(pain)
                ? draft.pains.filter((one) => one !== pain)
                : [...draft.pains, pain],
            })
          }
          onNext={() => (tell('pains'), next({}))}
        />
      ) : step === 'home' || step === 'city' ? (
        <RegionStep
          kind={step}
          chosen={step === 'home' ? draft.home : draft.region}
          directory={directory}
          onPick={pickRegion}
        />
      ) : step === 'when' ? (
        <WhenStep
          role={role}
          route={route(draft.region ?? '')}
          onPick={(cadence) => (tell('when'), next({ cadence }))}
        />
      ) : (
        <ChannelsStep
          region={draft.region ?? ''}
          regionName={directory.find(draft.region ?? '')?.name ?? ''}
          member={member}
          onNext={() => onDone(role)}
        />
      )}
      <ActionFailure error={failed ? 'errors.generic.description' : null} />
    </RoleBrand>
  );
}
