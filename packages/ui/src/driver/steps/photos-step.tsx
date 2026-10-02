import {
  CAR_PHOTO_KINDS,
  type CarPhotoKind,
  type DriverApplication,
  type ModerationReason,
} from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useRef, useState } from 'react';
import { compressImage } from '../../account/profile/compress-image';
import { StepLayout } from '../../account/step-layout';
import { useScreenView } from '../../context/analytics-context';
import { useApiClients } from '../../context/api-clients';
import { useI18n } from '../../context/i18n-context';
import { Screen } from '../../screen/screen';
import { MainButton } from '../../telegram/bottom-button';
import { haptic } from '../../telegram/feedback';
import { useHasCamera } from '../../telegram/in-telegram-context';
import { usePhotoTaker } from '../../media/use-photo-taker';
import { PhotoSlot } from '../photo-slot';
import { hasProblem } from '../problem-note';
import type { TranslationKey } from '@platform/i18n';
import { errorKey } from '../../market/error-text';

type PhotosStepProps = {
  readonly photos: DriverApplication['photos'];
  readonly reasons: readonly ModerationReason[];
  readonly onPhotos: (application: DriverApplication) => void;
  readonly onBack: () => void;
  readonly onDone: () => void;
};

// Three photos of the car with the main camera: front with the plate, side, inside (docs/04).
// Each has a frame that shows what to shoot; a photo to retake is marked red.
export function PhotosStep({ photos, reasons, onPhotos, onBack, onDone }: PhotosStepProps) {
  useScreenView('driver.photos');
  const { t } = useI18n();
  const { drivers } = useApiClients();
  const hasCamera = useHasCamera();
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
  // A photo to retake keeps the driver here until it is retaken.
  const ready = CAR_PHOTO_KINDS.every((item) => photos[item] && !hasProblem(reasons, item));
  return (
    <StepLayout icon="camera" title={t('drivers.photos.title')} hint={t('drivers.photos.hint')}>
      {/* The camera takes «Назад» over the step while it is open (docs/94 F6). */}
      <Screen onBack={onBack} />
      {hasCamera ? (
        camera.element
      ) : (
        <Text className="step-hint step-note">{t('drivers.photos.phoneOnly')}</Text>
      )}
      <div className="photo-slots">
        {CAR_PHOTO_KINDS.map((item) => (
          <PhotoSlot
            key={item}
            kind={item}
            taken={photos[item]}
            version={version}
            reasons={reasons}
            disabled={!hasCamera || busy !== null}
            onTake={() => take(item)}
          />
        ))}
      </div>
      {failure ? <Text className="step-error">{t(failure)}</Text> : null}
      {ready && !camera.isOpen ? <MainButton text={t('common.continue')} onClick={onDone} /> : null}
    </StepLayout>
  );
}
