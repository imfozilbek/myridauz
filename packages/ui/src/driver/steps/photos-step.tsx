import {
  type CarPhotoKind,
  CAR_PHOTO_KINDS,
  REASON_PLACE,
  type Car,
  type DriverApplication,
  type ModerationReason,
} from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { Text } from '@telegram-apps/telegram-ui';
import { useEffect } from 'react';
import { useAccount } from '../../account/account-context';
import { useFaceShot } from '../../account/profile/use-face-shot';
import { StepLayout } from '../../account/step-layout';
import { useScreenView } from '../../context/analytics-context';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { Screen } from '../../screen/screen';
import { MainButton } from '../../telegram/bottom-button';
import { confirm } from '../../telegram/feedback';
import { useHasCamera } from '../../telegram/in-telegram-context';
import { brandVars } from '../../theme/brand-vars';
import { CarHead } from '../car-head';
import { FaceTile } from '../face-tile';
import { PhotoTile } from '../photo-tile';
import { useCarShots } from '../use-car-shots';
import { hasProblem, photosReady } from '../problem-note';
import '../car-form/car-form.css';
import './photos-step.css';

type Props = {
  readonly car: Car;
  readonly photos: DriverApplication['photos'];
  readonly reasons: readonly ModerationReason[];
  // The team asked to fix it: the title names the photos to retake, «Qayta yuborish» sends.
  readonly fixing: boolean;
  // A fix opened by «Tuzatish» with one photo to retake: its camera opens at once (G79 В16).
  readonly shoot?: boolean;
  readonly failure: TranslationKey | null;
  // Said before the camera opens: a new photo of an approved car (G91 DRV-3).
  readonly warn?: TranslationKey;
  readonly onPhotos: (application: DriverApplication) => void;
  readonly onChange: () => void;
  readonly onBack: () => void;
  readonly onSend: () => void;
};

// «Mashina rasmi» (G62, mockup g62/1 screens 3 and 5): the car and its plate on top, one photo of the
// car from the front with its plate (owner decision 18.10.2026) with the main camera; no face (it is
// taken at the registration) and no review screen.
export function PhotosStep({
  car,
  photos,
  reasons,
  fixing,
  shoot = false,
  failure,
  warn,
  onPhotos,
  onChange,
  onBack,
  onSend,
}: Props) {
  useScreenView('driver.photos');
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const profile = useAccount()?.profile;
  const hasCamera = useHasCamera();
  const face = useFaceShot();
  const { camera, take, busy, failed, version } = useCarShots(onPhotos);
  const takeWarned = async (kind: CarPhotoKind) => {
    if (warn && !(await confirm(t(warn), t('common.continue')))) return;
    take(kind);
  };
  const disabled = !hasCamera || busy !== null || face.busy;
  const faceAsked = hasProblem(reasons, 'avatar');
  useEffect(() => {
    const retake = CAR_PHOTO_KINDS.filter((kind) => !photos[kind] || hasProblem(reasons, kind));
    if (shoot && hasCamera && !faceAsked && retake.length === 1 && retake[0]) take(retake[0]);
    // Once, when the step opens.
  }, []);
  const bad = CAR_PHOTO_KINDS.filter((item) => hasProblem(reasons, item)).length + (faceAsked ? 1 : 0);
  // A photo to retake keeps the driver here until it is retaken.
  const ready = photosReady(photos, reasons);
  const shown = failure ?? failed ?? face.failure;
  const photoPlaces: readonly string[] = [...CAR_PHOTO_KINDS, 'avatar'];
  const asked = reasons.filter((reason) => photoPlaces.includes(REASON_PLACE[reason]));
  return (
    <div className="photos-screen" style={brandVars(colors)}>
      <StepLayout
        {...(fixing ? {} : { steps: [2, 2] as const })}
        title={bad > 0 ? t('drivers.fix.title', { count: bad }) : t('drivers.photos.title')}
        hint={
          bad > 0 ? asked.map((reason) => t(`drivers.reason.${reason}`)).join('. ') : t('drivers.photos.step')
        }
      >
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
        {fixing ? null : <CarHead car={car} onChange={onChange} />}
        <div className="photo-tiles">
          {CAR_PHOTO_KINDS.map((item) => (
            <PhotoTile
              key={item}
              kind={item}
              car={car}
              taken={photos[item]}
              version={version}
              reasons={reasons}
              fixing={fixing}
              disabled={disabled}
              onTake={() => void takeWarned(item)}
            />
          ))}
          {faceAsked && profile ? (
            <FaceTile profile={profile} reasons={reasons} disabled={disabled} onTake={face.take} />
          ) : null}
        </div>
        {shown ? <Text className="step-error">{t(shown)}</Text> : null}
        {camera.isOpen || face.isOpen ? null : (
          <MainButton
            text={t(fixing ? 'drivers.fix.send' : 'drivers.send')}
            disabled={!ready}
            onClick={onSend}
          />
        )}
      </StepLayout>
    </div>
  );
}
