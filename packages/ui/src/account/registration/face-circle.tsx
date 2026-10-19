import { useEffect, useState } from 'react';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { Icon } from '../../icons';
import { usePhotoTaker } from '../../media/use-photo-taker';
import { haptic } from '../../telegram/feedback';
import { compressImage } from '../profile/compress-image';

const CAMERA_ICON = 34;

type FaceCircleProps = {
  readonly photo: Blob | null;
  readonly onPhoto: (photo: Blob) => void;
  // A passenger may go without a photo: the circle says so (owner decision 19.10.2026, G51).
  readonly optional: boolean;
};

// The face of screen 2 (G58, docs/118): a circle «Rasm qoʻshish», then the photo and
// «Rasmni almashtirish». Only the front camera, never the gallery (owner, 17.10.2026): our camera
// with the oval, the camera app of the phone where ours cannot open.
export function FaceCircle({ photo, onPhoto, optional }: FaceCircleProps) {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const [failed, setFailed] = useState(false);
  const url = usePreview(photo);
  const taken = async (shot: Blob) => {
    try {
      onPhoto(await compressImage(shot));
      setFailed(false);
      haptic.success();
    } catch {
      haptic.error();
      setFailed(true);
    }
  };
  const camera = usePhotoTaker('user', (shot) => void taken(shot));
  const take = () =>
    camera.open({
      guide: 'face',
      title: t('account.avatar.cameraTitle'),
      hint: t('account.avatar.cameraHint'),
    });
  const label = t(
    photo ? 'account.avatar.change' : optional ? 'account.avatar.optional' : 'account.avatar.add',
  );
  return (
    <div className="face-circle">
      {camera.element}
      <button
        type="button"
        className={url ? 'face-circle-button' : 'face-circle-button face-circle-empty'}
        aria-label={label}
        onClick={take}
      >
        {url ? (
          <img className="face-circle-photo" src={url} alt={t('account.avatar.cameraTitle')} />
        ) : (
          <>
            <Icon name="camera" size={CAMERA_ICON} color={colors.brandText} />
            <span className="face-circle-plus">+</span>
          </>
        )}
      </button>
      <p className="face-circle-label" onClick={take}>
        {label}
      </p>
      {failed ? <p className="about-error">{t('account.avatar.failed')}</p> : null}
    </div>
  );
}

// The picked photo shown at once, before any upload; the address is freed when it changes.
function usePreview(photo: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!photo) return setUrl(null);
    const next = URL.createObjectURL(photo);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [photo]);
  return url;
}
