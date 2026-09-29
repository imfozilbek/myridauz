import type { CarPhotoKind, ModerationReason } from '@platform/contracts';
import { Caption, Text } from '@telegram-apps/telegram-ui';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon, type IconName } from '../icons';
import { useBlobUrl } from '../media/use-blob-url';
import { hasProblem, ProblemNote } from './problem-note';

const PLACEHOLDER_ICON: Record<CarPhotoKind, IconName> = {
  front: 'car',
  side: 'carSide',
  interior: 'carInterior',
};
const PLACEHOLDER_ICON_SIZE = 56;
const ACTION_ICON_SIZE = 16;

type PhotoSlotProps = {
  readonly kind: CarPhotoKind;
  readonly taken: boolean;
  // Changes after each upload, so the new photo is shown.
  readonly version: number;
  readonly reasons: readonly ModerationReason[];
  readonly disabled: boolean;
  readonly onTake: () => void;
};

// One photo to take: a frame with a hint of what to shoot, or the photo itself.
// A photo the team asked to retake has a red frame and the reason under it (docs/04).
export function PhotoSlot({ kind, taken, version, reasons, disabled, onTake }: PhotoSlotProps) {
  const { t } = useI18n();
  const { drivers } = useApiClients();
  const { colors } = useBrand().theme;
  const url = useBlobUrl(taken ? () => drivers.getPhoto(kind) : null, `${kind}:${version}`);
  const problem = hasProblem(reasons, kind);
  return (
    <div className="photo-slot">
      <button
        type="button"
        className={problem ? 'photo-frame photo-frame-problem' : 'photo-frame'}
        disabled={disabled}
        onClick={onTake}
      >
        {url ? (
          <img src={url} alt={t(`drivers.photo.${kind}`)} />
        ) : (
          <span className="photo-placeholder">
            <Icon name={PLACEHOLDER_ICON[kind]} size={PLACEHOLDER_ICON_SIZE} color={colors.textMuted} />
            <Caption className="photo-placeholder-hint">{t(`drivers.photo.${kind}.hint`)}</Caption>
          </span>
        )}
        <span className="photo-action">
          <Icon name="camera" size={ACTION_ICON_SIZE} />
          {t(taken ? 'drivers.photo.retake' : 'drivers.photo.take')}
        </span>
      </button>
      <Text weight="2" className="photo-label">
        {t(`drivers.photo.${kind}`)}
      </Text>
      <ProblemNote reasons={reasons} place={kind} />
    </div>
  );
}
