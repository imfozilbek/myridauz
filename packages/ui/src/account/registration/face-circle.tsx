import { Text } from '@telegram-apps/telegram-ui';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { Icon } from '../../icons';
import { haptic } from '../../telegram/feedback';
import { compressImage } from '../profile/compress-image';

type FaceCircleProps = {
  readonly photo: Blob | null;
  readonly onPhoto: (photo: Blob) => void;
};

// The face of screen 2 (G58, docs/118): a circle «Rasm qoʻshish», then the photo and
// «Rasmni almashtirish». The phone offers the camera or the gallery; a computer opens a file.
export function FaceCircle({ photo, onPhoto }: FaceCircleProps) {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const input = useRef<HTMLInputElement>(null);
  const [failed, setFailed] = useState(false);
  const url = usePreview(photo);
  const picked = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      onPhoto(await compressImage(file));
      setFailed(false);
      haptic.success();
    } catch {
      haptic.error();
      setFailed(true);
    }
  };
  const label = t(photo ? 'account.avatar.change' : 'account.avatar.add');
  return (
    <div className="face-circle">
      <input ref={input} className="file-input" type="file" accept="image/*" onChange={picked} />
      <button
        type="button"
        className="face-circle-button"
        aria-label={label}
        onClick={() => input.current?.click()}
      >
        {url ? (
          <img className="face-circle-photo" src={url} alt={t('account.avatar.cameraTitle')} />
        ) : (
          <span className="face-circle-empty" style={{ borderColor: colors.brandStrong }}>
            <Icon name="camera" size={34} color={colors.brandText} />
            <span className="face-circle-plus" style={{ background: colors.brandStrong }}>
              <Icon name="more" size={18} color={colors.bg} />
            </span>
          </span>
        )}
      </button>
      <Text className="face-circle-label" onClick={() => input.current?.click()}>
        {label}
      </Text>
      {failed ? <Text className="step-error">{t('account.avatar.failed')}</Text> : null}
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
