import {
  CAR_PHOTO_KINDS,
  type CarPhotoKind,
  type DriverApplication,
  type ModerationReason,
} from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useRef, useState, type ChangeEvent } from 'react';
import { compressImage } from '../../account/profile/compress-image';
import { StepLayout } from '../../account/step-layout';
import { useScreenView } from '../../context/analytics-context';
import { useApiClients } from '../../context/api-clients';
import { useI18n } from '../../context/i18n-context';
import { BackButton } from '../../telegram/back-button';
import { MainButton } from '../../telegram/bottom-button';
import { haptic } from '../../telegram/feedback';
import { useHasCamera } from '../../telegram/in-telegram-context';
import { PhotoSlot } from '../photo-slot';
import { hasProblem } from '../problem-note';

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
  const input = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<CarPhotoKind>('front');
  const [busy, setBusy] = useState<CarPhotoKind | null>(null);
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState(0);
  const take = (next: CarPhotoKind) => {
    setKind(next);
    input.current?.click();
  };
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(kind);
    setFailed(false);
    try {
      const next = await drivers.uploadPhoto(kind, await compressImage(file, 'whole'));
      if (next) onPhotos(next);
      setVersion((value) => value + 1);
      haptic.success();
    } catch {
      haptic.error();
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };
  // A photo to retake keeps the driver here until it is retaken.
  const ready = CAR_PHOTO_KINDS.every((item) => photos[item] && !hasProblem(reasons, item));
  return (
    <StepLayout icon="camera" title={t('drivers.photos.title')} hint={t('drivers.photos.hint')}>
      <BackButton onClick={onBack} />
      {hasCamera ? (
        <input
          ref={input}
          className="file-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => void upload(event)}
        />
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
      {failed ? <Text className="step-error">{t('drivers.photos.failed')}</Text> : null}
      {ready ? <MainButton text={t('common.continue')} onClick={onDone} /> : null}
    </StepLayout>
  );
}
