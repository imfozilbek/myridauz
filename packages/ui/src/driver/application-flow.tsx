import './driver.css';
import { carSchema, type CarInput, type DriverApplication, type DriverStep } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useState, type ReactNode } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { DraftRestored } from '../flow/draft-restored';
import { useStepProgress } from '../flow/step-progress';
import { errorKey } from '../market/error-text';
import { useUnsavedGuard } from '../screen/unsaved-guard';
import { haptic } from '../telegram/feedback';
import { nextStep, previousStep, progressOf, type Step } from './application-steps';
import { useCarAnswers } from './car-answers';
import { CarStep, type CarStepName } from './car-step';
import { PhotosStep } from './steps/photos-step';
import { PlateStep } from './steps/plate-step';
import { ReviewStep, type ReviewTarget } from './steps/review-step';
import { useReasons } from './use-reasons';

const CAR_STEPS: readonly string[] = ['make', 'model', 'color', 'seats'];
const isCarStep = (step: Step): step is CarStepName => CAR_STEPS.includes(step);

type ApplicationFlowProps = {
  readonly initial: DriverApplication | null;
  readonly onSubmitted: (application: DriverApplication) => void;
  // To the main screen, or an application already sent back to its status (docs/94 B4).
  readonly onClose: () => void;
};

// The application, one question per screen (docs/04, docs/19). A sent application opens on the
// review; a new one on the make, with the answers of a draft (G34).
export function ApplicationFlow({ initial, onSubmitted, onClose }: ApplicationFlowProps) {
  const { track } = useAnalytics();
  const { drivers } = useApiClients();
  const reviewing = initial?.car !== null && initial?.car !== undefined;
  const { step, car, shown, answer, go, dirty, restored, clear } = useCarAnswers(initial?.car ?? undefined);
  // A new application is a draft and is not lost; a sent one being changed asks before leaving.
  const guard = useUnsavedGuard(reviewing && dirty);
  const [photos, setPhotos] = useState(initial?.photos ?? { front: false, side: false, interior: false });
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  useStepProgress(...progressOf(step));
  const { reasons, keepOnly, fixed } = useReasons(initial?.reasons ?? []);

  const done = (current: Step, patch: Partial<CarInput>, passed?: DriverStep) => {
    const alone = current === 'make' && !('model' in patch);
    answer(patch, alone, (next) => nextStep(current, next, 'model' in patch, reviewing));
    if (!alone && Object.keys(patch).length > 0) fixed(current === 'plate' ? 'plate' : 'car');
    if (passed) track({ name: 'driver_application_step', screen: 'driver', step: passed });
  };
  const back = (current: Step) => () => {
    const to = reviewing ? 'review' : previousStep(current, car);
    if (to) go(to);
    else onClose();
  };
  const leave = guard(() => {
    clear();
    onClose();
  });

  const send = async () => {
    const parsed = carSchema.safeParse(car);
    setFailure(null);
    try {
      if (!parsed.success) throw new Error('ui.car_incomplete');
      const application = await drivers.submit(parsed.data);
      track({ name: 'driver_application_step', screen: 'driver', step: 'submitted' });
      haptic.success();
      clear();
      if (application) onSubmitted(application);
    } catch (caught) {
      haptic.error();
      setFailure(errorKey(caught));
    }
  };

  const screen = (): ReactNode => {
    if (isCarStep(step)) {
      return (
        // A new screen for each step: the typing of "Boshqa" does not stay on the next question.
        <CarStep
          key={step}
          step={step}
          car={shown}
          onBack={back(step)}
          onDone={(patch, passed) => done(step, patch, passed)}
        />
      );
    }
    if (step === 'plate') {
      return (
        <PlateStep
          initial={car.plate ?? ''}
          reasons={reasons}
          onBack={back('plate')}
          onDone={(plate) => done('plate', { plate }, 'plate')}
        />
      );
    }
    if (step === 'photos') {
      return (
        <PhotosStep
          photos={photos}
          reasons={reasons}
          onPhotos={(next) => {
            setPhotos(next.photos);
            keepOnly(next.reasons);
          }}
          onBack={back('photos')}
          onDone={() => done('photos', {}, 'photos')}
        />
      );
    }
    const complete = carSchema.safeParse(car);
    if (!complete.success) return null;
    return (
      <ReviewStep
        car={complete.data}
        photos={photos}
        reasons={reasons}
        recheck={initial?.status === 'approved'}
        failure={failure}
        onEdit={(target: ReviewTarget) => go(target)}
        onSend={send}
        onBack={reviewing ? leave : back('review')}
      />
    );
  };
  return (
    <>
      {screen()}
      <DraftRestored shown={restored} />
    </>
  );
}
