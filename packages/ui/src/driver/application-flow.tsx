import './driver.css';
import { carSchema, type CarInput, type DriverApplication, type DriverStep } from '@platform/contracts';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { CarStep, type CarStepName } from './car-step';
import { useStepProgress } from '../flow/step-progress';
import { nextStep, previousStep, progressOf, type Step } from './application-steps';
import { useReasons } from './use-reasons';
import { AvatarStep } from './steps/avatar-step';
import { PhotosStep } from './steps/photos-step';
import { PlateStep } from './steps/plate-step';
import { ReviewStep, type ReviewTarget } from './steps/review-step';
import type { TranslationKey } from '@platform/i18n';
import { errorKey } from '../market/error-text';

const CAR_STEPS: readonly string[] = ['make', 'model', 'color', 'seats'];
const isCarStep = (step: Step): step is CarStepName => CAR_STEPS.includes(step);

type ApplicationFlowProps = {
  readonly initial: DriverApplication | null;
  readonly onSubmitted: (application: DriverApplication) => void;
  // An approved driver may leave without changes.
  readonly onClose?: () => void;
};

// The application, one question per screen (docs/04, docs/19). A saved application opens on the review.
export function ApplicationFlow({ initial, onSubmitted, onClose }: ApplicationFlowProps) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { drivers } = useApiClients();
  const [car, setCar] = useState<Partial<CarInput>>(initial?.car ?? {});
  const [photos, setPhotos] = useState(initial?.photos ?? { front: false, side: false, interior: false });
  const [step, setStep] = useState<Step>(initial?.car ? 'review' : 'intro');
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  useStepProgress(...progressOf(step));
  const { reasons, keepOnly, fixed } = useReasons(initial?.reasons ?? []);
  const reviewing = initial?.car !== null && initial?.car !== undefined;

  const done = (current: Step, patch: Partial<CarInput>, passed?: DriverStep) => {
    const next = { ...car, ...patch };
    setCar(next);
    if (Object.keys(patch).length > 0) fixed(current === 'plate' ? 'plate' : 'car');
    if (passed) track({ name: 'driver_application_step', screen: 'driver', step: passed });
    // A new make needs its model; any other change goes back to the review.
    setStep(nextStep(current, next, 'model' in patch, reviewing));
  };
  const back = (current: Step) => () => setStep(reviewing ? 'review' : previousStep(current, car));

  const send = async () => {
    const parsed = carSchema.safeParse(car);
    setFailure(null);
    try {
      if (!parsed.success) throw new Error('ui.car_incomplete');
      const application = await drivers.submit(parsed.data);
      track({ name: 'driver_application_step', screen: 'driver', step: 'submitted' });
      haptic.success();
      if (application) onSubmitted(application);
    } catch (caught) {
      haptic.error();
      setFailure(errorKey(caught));
    }
  };

  if (isCarStep(step)) {
    return (
      // A new screen for each step: the typing of "Boshqa" does not stay on the next question.
      <CarStep
        key={step}
        step={step}
        car={car}
        onBack={back(step)}
        onDone={(patch, passed) => done(step, patch, passed)}
      />
    );
  }
  switch (step) {
    case 'intro':
      return (
        <StepLayout icon="car" title={t('drivers.intro.title')} hint={t('drivers.intro.hint')}>
          <MainButton text={t('drivers.intro.start')} onClick={() => setStep('make')} />
        </StepLayout>
      );
    case 'plate':
      return (
        <PlateStep
          initial={car.plate ?? ''}
          reasons={reasons}
          onBack={back('plate')}
          onDone={(plate) => done('plate', { plate }, 'plate')}
        />
      );
    case 'avatar':
      return (
        <AvatarStep reasons={reasons} onBack={back('avatar')} onDone={() => done('avatar', {}, 'avatar')} />
      );
    case 'photos':
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
    default: {
      const complete = carSchema.safeParse(car);
      if (!complete.success) return null;
      return (
        <ReviewStep
          car={complete.data}
          reasons={reasons}
          recheck={initial?.status === 'approved'}
          failure={failure}
          onEdit={(target: ReviewTarget) => setStep(target)}
          onSend={send}
          {...(onClose ? { onBack: onClose } : {})}
        />
      );
    }
  }
}
