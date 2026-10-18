import type { Car, CarPhotoKind, ModerationReason } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useBlobUrl } from '../media/use-blob-url';
import { CarSketch } from './car-sketch';
import { hasProblem } from './problem-note';

const CAMERA_ICON = 22;

type Props = {
  readonly kind: CarPhotoKind;
  readonly car: Car;
  readonly taken: boolean;
  // Changes after each upload, so the new photo is shown.
  readonly version: number;
  readonly reasons: readonly ModerationReason[];
  // The fix (mockup g62/1 screen 5): a good photo says «Yaxshi», a bad one its reason.
  readonly fixing: boolean;
  readonly disabled: boolean;
  readonly onTake: () => void;
};

// The photo of the car (G62, one photo since 18.10.2026): the photo, or the driver's own car drawn
// from the front with its plate while it is not taken; a photo to retake has a red frame and its reason.
export function PhotoTile({ kind, car, taken, version, reasons, fixing, disabled, onTake }: Props) {
  const { t } = useI18n();
  const { drivers } = useApiClients();
  const url = useBlobUrl(taken ? () => drivers.getPhoto(kind) : null, `${kind}:${version}`);
  const problem = reasons.find((reason) => hasProblem([reason], kind));
  const label = t('drivers.tile.front');
  const look = problem
    ? 'photo-tile photo-tile-car photo-tile-problem'
    : taken
      ? 'photo-tile photo-tile-car'
      : 'photo-tile photo-tile-car photo-tile-empty';
  const hint = problem
    ? t(`drivers.reason.${problem}`)
    : fixing
      ? t('drivers.photo.good')
      : t('drivers.tile.front.hint');
  return (
    <button type="button" className={look} data-taken={taken} disabled={disabled} onClick={onTake}>
      <span className="photo-tile-frame">
        {url ? <img src={url} alt={label} /> : null}
        {taken ? null : <CarSketch car={car} />}
        {taken ? null : (
          <span className="photo-tile-camera">
            <Icon name="camera" size={CAMERA_ICON} />
          </span>
        )}
      </span>
      <span className="photo-tile-text">
        <b>{label}</b>
        <span>{hint}</span>
      </span>
    </button>
  );
}
