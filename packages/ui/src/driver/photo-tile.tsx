import type { CarPhotoKind, ModerationReason } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useBlobUrl } from '../media/use-blob-url';
import { hasProblem } from './problem-note';

const CAMERA_ICON = 28;
// The words under each photo of the mockup g62/1: what to show on it.
const HINT = {
  front: 'drivers.tile.front.hint',
  side: 'drivers.tile.side.hint',
  interior: 'drivers.tile.interior.hint',
} as const;
const LABEL = {
  front: 'drivers.tile.front',
  side: 'drivers.photo.side',
  interior: 'drivers.photo.interior',
} as const;

type Props = {
  readonly kind: CarPhotoKind;
  readonly taken: boolean;
  // Changes after each upload, so the new photo is shown.
  readonly version: number;
  readonly reasons: readonly ModerationReason[];
  // The fix (mockup g62/1 screen 5): a good photo says «Yaxshi», a bad one its reason.
  readonly fixing: boolean;
  readonly disabled: boolean;
  readonly onTake: () => void;
};

// One photo of the car as a tile (G62, mockup g62/1 screens 3 and 5): the photo, or a dashed frame
// with a camera while it is not taken; a photo to retake has a red frame and its reason.
export function PhotoTile({ kind, taken, version, reasons, fixing, disabled, onTake }: Props) {
  const { t } = useI18n();
  const { drivers } = useApiClients();
  const url = useBlobUrl(taken ? () => drivers.getPhoto(kind) : null, `${kind}:${version}`);
  const problem = reasons.find((reason) => hasProblem([reason], kind));
  const label = t(LABEL[kind]);
  const look = problem
    ? 'photo-tile photo-tile-problem'
    : taken
      ? 'photo-tile'
      : 'photo-tile photo-tile-empty';
  const hint = problem ? t(`drivers.reason.${problem}`) : fixing ? t('drivers.photo.good') : t(HINT[kind]);
  return (
    <button type="button" className={look} data-taken={taken} disabled={disabled} onClick={onTake}>
      <span className="photo-tile-frame">
        {url ? <img src={url} alt={label} /> : null}
        {taken ? null : <Icon name="camera" size={CAMERA_ICON} />}
      </span>
      <span className="photo-tile-text">
        <b>{label}</b>
        <span>{hint}</span>
      </span>
    </button>
  );
}
