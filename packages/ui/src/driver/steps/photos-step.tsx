import {
  CAR_PHOTO_KINDS,
  type CarPhotoKind,
  type DriverApplication,
  type ModerationReason,
} from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { Text } from '@telegram-apps/telegram-ui';
import { useRef, useState } from 'react';
import { useAccount } from '../../account/account-context';
import { compressImage } from '../../account/profile/compress-image';
import { StepLayout } from '../../account/step-layout';
import { useScreenView } from '../../context/analytics-context';
import { useApiClients } from '../../context/api-clients';
import { useI18n } from '../../context/i18n-context';
import { errorKey } from '../../market/error-text';
import { usePhotoTaker } from '../../media/use-photo-taker';
import { Screen } from '../../screen/screen';
import { MainButton } from '../../telegram/bottom-button';
import { haptic } from '../../telegram/feedback';
import { useHasCamera } from '../../telegram/in-telegram-context';
import { FaceSlot, useFaceShot } from '../face-shot';
import { CarPhotoSlot } from '../photo-slot';
import { hasProblem } from '../problem-note';

type PhotosStepProps = {
  readonly photos: DriverApplication['photos'];
  readonly reasons: readonly ModerationReason[];
  readonly onPhotos: (application: DriverApplication) => void;
  readonly onBack: () => void;
  readonly onDone: () => void;
};

// All photos on one screen (G34): the face with the front camera, then the car with the main
// camera: front with the plate, side, inside (docs/04). A photo to retake is marked red.
export function PhotosStep({ photos, reasons, onPhotos, onBack, onDone }: PhotosStepProps) {
  useScreenView('driver.photos');
  const { t } = useI18n();
  const { drivers } = useApiClients();
  const profile = useAccount()?.profile;
  const hasCamera = useHasCamera();
  const face = useFaceShot();
  // The photo being taken: the camera answers later, the kind must not change meanwhile.
  const kind = useRef<CarPhotoKind>('front');
  const [busy, setBusy] = useState<CarPhotoKind | null>(null);
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  const [version, setVersion] = useState(0);
  const upload = async (file: Blob) => {
    const current = kind.current;
    setBusy(current);
    setFailure(null);
    try {
      const next = await drivers.uploadPhoto(current, await compressImage(file, 'whole'));
      if (next) onPhotos(next);
      setVersion((value) => value + 1);
      haptic.success();
    } catch (caught) {
      haptic.error();
      setFailure(errorKey(caught, 'drivers.photos.failed'));
    } finally {
      setBusy(null);
    }
  };
  const camera = usePhotoTaker('environment', (photo) => void upload(photo));
  const take = (next: CarPhotoKind) => {
    kind.current = next;
    camera.open({ guide: next, title: t(`drivers.photo.${next}`), hint: t(`drivers.photo.${next}.hint`) });
  };
  const disabled = !hasCamera || busy !== null || face.busy;
  // A photo to retake keeps the driver here until it is retaken.
  const faceReady = profile?.hasAvatar === true && !hasProblem(reasons, 'avatar');
  const ready = faceReady && CAR_PHOTO_KINDS.every((item) => photos[item] && !hasProblem(reasons, item));
  const shown = failure ?? face.failure;
  return (
    <StepLayout icon="camera" title={t('drivers.photos.screen')} hint={t('drivers.photos.screenHint')}>
      {/* A camera takes «Назад» over the step while it is open (docs/94 F6, F7). */}
      <Screen onBack={onBack} />
      {hasCamera ? (
        <>
          {face.element}
          {camera.element}
        </>
      ) : (
        <Text className="step-hint step-note">{t('drivers.photos.phoneOnly')}</Text>
      )}
      <div className="photo-slots">
        {profile ? (
          <FaceSlot profile={profile} reasons={reasons} disabled={disabled} onTake={face.take} />
        ) : null}
        {CAR_PHOTO_KINDS.map((item) => (
          <CarPhotoSlot
            key={item}
            kind={item}
            taken={photos[item]}
            version={version}
            reasons={reasons}
            disabled={disabled}
            onTake={() => take(item)}
          />
        ))}
      </div>
      {shown ? <Text className="step-error">{t(shown)}</Text> : null}
      {ready && !camera.isOpen && !face.isOpen ? (
        <MainButton text={t('common.continue')} onClick={onDone} />
      ) : null}
    </StepLayout>
  );
}
