import { CAR_PHOTO_KINDS, type CarPhotoKind, type PersonId } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useBlobUrl } from '../media/use-blob-url';

const CAR_ICON = 16;

type PhotoProps = {
  readonly userId: PersonId;
  readonly kind: CarPhotoKind;
  readonly onOpen: (kind: CarPhotoKind) => void;
};

// One car photo of an application; while it loads, its place and name (mockup g67/2 screen 3).
function CasePhoto({ userId, kind, onOpen }: PhotoProps) {
  const { t } = useI18n();
  const { moderation } = useApiClients();
  const url = useBlobUrl(() => moderation.photo(userId, kind), `${userId}:${kind}`);
  const label = t(`drivers.photo.${kind}`);
  return (
    <button
      type="button"
      className={`case-photo case-photo-${kind}`}
      aria-label={label}
      onClick={() => onOpen(kind)}
    >
      {url ? (
        <img src={url} alt={label} />
      ) : (
        <span className="case-photo-empty">
          {kind === 'front' ? <Icon name="carSide" size={CAR_ICON} /> : null}
          {label}
        </span>
      )}
    </button>
  );
}

type GridProps = { readonly userId: PersonId; readonly onOpen: (kind: CarPhotoKind) => void };

// The three car photos, the front with the plate large (docs/120: no face in the application, path 5).
// A tap opens the photo on the whole screen (docs/89 S8).
export function CasePhotos({ userId, onOpen }: GridProps) {
  return (
    <div className="case-photos">
      {CAR_PHOTO_KINDS.map((kind) => (
        <CasePhoto key={kind} userId={userId} kind={kind} onOpen={onOpen} />
      ))}
    </div>
  );
}
