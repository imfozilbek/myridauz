import type { CarPhotoKind, DriverApplication } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useRef, useState } from 'react';
import { compressImage } from '../account/profile/compress-image';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { errorKey } from '../market/error-text';
import { usePhotoTaker } from '../media/use-photo-taker';
import { haptic } from '../telegram/feedback';

// The car photo with the main camera (docs/04): it goes to the server at once. One photo since
// 18.10.2026 (owner decision), so no camera opens after it.
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
