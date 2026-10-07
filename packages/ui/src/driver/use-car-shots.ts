import { CAR_PHOTO_KINDS, type CarPhotoKind, type DriverApplication } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useRef, useState } from 'react';
import { compressImage } from '../account/profile/compress-image';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { errorKey } from '../market/error-text';
import { usePhotoTaker } from '../media/use-photo-taker';
import { haptic } from '../telegram/feedback';

// The car photos with the main camera (docs/04): each one goes to the server at once, then the
// camera opens again for the next empty photo, no tap per tile (G40, docs/106 K7).
export function useCarShots(onPhotos: (application: DriverApplication) => void) {
  const { t } = useI18n();
  const { drivers } = useApiClients();
  // The photo being taken: the camera answers later, the kind must not change meanwhile.
  const kind = useRef<CarPhotoKind>('front');
  const [busy, setBusy] = useState<CarPhotoKind | null>(null);
  const [failed, setFailed] = useState<TranslationKey | null>(null);
  // Changes after each upload, so the new photo is shown.
  const [version, setVersion] = useState(0);
  const upload = async (file: Blob) => {
    const current = kind.current;
    setBusy(current);
    setFailed(null);
    try {
      const next = await drivers.uploadPhoto(current, await compressImage(file, 'whole'));
      if (next) onPhotos(next);
      setVersion((value) => value + 1);
      haptic.success();
      const missing = next && CAR_PHOTO_KINDS.find((item) => item !== current && !next.photos[item]);
      if (missing) take(missing);
    } catch (caught) {
      haptic.error();
      setFailed(errorKey(caught, 'drivers.photos.failed'));
    } finally {
      setBusy(null);
    }
  };
  const camera = usePhotoTaker('environment', (photo) => void upload(photo));
  const take = (next: CarPhotoKind) => {
    kind.current = next;
    camera.open({ guide: next, title: t(`drivers.photo.${next}`), hint: t(`drivers.photo.${next}.hint`) });
  };
  return { camera, take, busy, failed, version };
}
