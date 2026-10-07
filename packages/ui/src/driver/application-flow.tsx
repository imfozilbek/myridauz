import './driver.css';
import {
  CAR_PHOTO_KINDS,
  carSchema,
  formatPlate,
  type CarInput,
  type DriverApplication,
} from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { DraftRestored } from '../flow/draft-restored';
import { errorKey } from '../market/error-text';
import { useUnsavedGuard } from '../screen/unsaved-guard';
import { haptic } from '../telegram/feedback';
import { useCarAnswers } from './car-answers';
import { CarScreen } from './car-form/car-screen';
import { hasProblem } from './problem-note';
import { PhotosStep } from './steps/photos-step';
import { useReasons } from './use-reasons';

type ApplicationFlowProps = {
  readonly initial: DriverApplication | null;
  readonly onSubmitted: (application: DriverApplication) => void;
  // To the main screen (docs/94 B4).
  readonly onClose: () => void;
};

const NO_PHOTOS = { front: false, side: false, interior: false };

// The application in 2 screens (G62, docs/118 path 5): the car, then its photos and the sending.
// A fix opens on the car when the team asked about it, else on the photos.
export function ApplicationFlow({ initial, onSubmitted, onClose }: ApplicationFlowProps) {
  const { track } = useAnalytics();
  const { drivers } = useApiClients();
  const known = initial?.car ?? undefined;
  const fixing = initial?.status === 'changes_requested';
  const { reasons, keepOnly, fixed } = useReasons(initial?.reasons ?? []);
  const carAsked = hasProblem(reasons, 'car') || hasProblem(reasons, 'plate');
  const first = fixing && !carAsked ? 'photos' : 'car';
  const { step, car, change, go, dirty, restored, clear } = useCarAnswers(known, first);
  // A new application is a draft and is not lost; a sent one being changed asks before leaving.
  const guard = useUnsavedGuard(known !== undefined && dirty);
  const [photos, setPhotos] = useState(initial?.photos ?? NO_PHOTOS);
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  const leave = guard(() => {
    if (known === undefined) return onClose();
    clear();
    onClose();
  });

  const send = async () => {
    setFailure(null);
    try {
      const parsed = carSchema.safeParse(car);
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

  const complete = carSchema.safeParse(car);
  if (step === 'photos' && complete.success)
    return (
      <PhotosStep
        car={complete.data}
        photos={photos}
        reasons={reasons}
        fixing={fixing}
        failure={failure}
        onPhotos={(next) => {
          const all = CAR_PHOTO_KINDS.every((kind) => next.photos[kind]);
          if (all && !CAR_PHOTO_KINDS.every((kind) => photos[kind]))
            track({ name: 'driver_application_step', screen: 'driver', step: 'photos' });
          setPhotos(next.photos);
          keepOnly(next.reasons);
        }}
        onChange={() => go('car')}
        onBack={() => go('car')}
        onSend={send}
      />
    );
  // A changed field is no longer what the team asked about: its red mark goes away.
  const edit = (patch: Partial<CarInput>) => {
    change(patch);
    if ('plate' in patch && formatPlate(patch.plate ?? '') !== formatPlate(known?.plate ?? ''))
      fixed('plate');
    if (['make', 'model', 'color', 'seats'].some((field) => field in patch)) fixed('car');
  };
  return (
    <>
      <CarScreen
        car={car}
        reasons={reasons}
        onChange={edit}
        onBack={leave}
        onDone={() => {
          track({ name: 'driver_application_step', screen: 'driver', step: 'car' });
          go('photos');
        }}
      />
      <DraftRestored shown={restored} />
    </>
  );
}
