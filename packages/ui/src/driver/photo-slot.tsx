import type { CarPhotoKind, ModerationReason, ProblemPlace } from '@platform/contracts';
import { Caption, Text } from '@telegram-apps/telegram-ui';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon, type IconName } from '../icons';
import { useBlobUrl } from '../media/use-blob-url';
import { hasProblem, ProblemNote } from './problem-note';

const CAR_ICON: Record<CarPhotoKind, IconName> = {
  front: 'car',
  side: 'carSide',
  interior: 'carInterior',
};
const PLACEHOLDER_ICON_SIZE = 36;
const ACTION_ICON_SIZE = 16;

type PhotoSlotProps = {
  readonly icon: IconName;
  readonly label: string;
  readonly hint?: string;
  readonly url: string | null;
  readonly taken: boolean;
  readonly reasons: readonly ModerationReason[];
  readonly place: ProblemPlace;
  readonly disabled: boolean;
  readonly onTake: () => void;
};

// One photo to take, as a compact row: a small frame (the icon of what to shoot, or the photo)
// and what to shoot. A photo the team asked to retake has a red frame and the reason under it (docs/04).
export function PhotoSlot({
  icon,
  label,
  hint,
  url,
  taken,
  reasons,
  place,
  disabled,
  onTake,
}: PhotoSlotProps) {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const problem = hasProblem(reasons, place);
  return (
    <button type="button" className="photo-slot" disabled={disabled} onClick={onTake}>
      <span className={problem ? 'photo-frame photo-frame-problem' : 'photo-frame'}>
        {url ? (
          <img src={url} alt={label} />
        ) : (
          <Icon name={icon} size={PLACEHOLDER_ICON_SIZE} color={colors.textMuted} />
        )}
      </span>
      <span className="photo-text">
        <Text weight="2">{label}</Text>
        {hint ? <Caption className="photo-hint">{hint}</Caption> : null}
        <ProblemNote reasons={reasons} place={place} />
        <span className="photo-action">
          <Icon name="camera" size={ACTION_ICON_SIZE} />
          {t(taken ? 'drivers.photo.retake' : 'drivers.photo.take')}
        </span>
      </span>
    </button>
  );
}

type CarPhotoSlotProps = Pick<PhotoSlotProps, 'taken' | 'reasons' | 'disabled' | 'onTake'> & {
  readonly kind: CarPhotoKind;
  // Changes after each upload, so the new photo is shown.
  readonly version: number;
};

// A photo of the car, loaded from the application once it is taken.
export function CarPhotoSlot({ kind, version, taken, ...rest }: CarPhotoSlotProps) {
  const { t } = useI18n();
  const { drivers } = useApiClients();
  const url = useBlobUrl(taken ? () => drivers.getPhoto(kind) : null, `${kind}:${version}`);
  return (
    <PhotoSlot
      {...rest}
      icon={CAR_ICON[kind]}
      label={t(`drivers.photo.${kind}`)}
      hint={t(`drivers.photo.${kind}.hint`)}
      url={url}
      taken={taken}
      place={kind}
    />
  );
}
