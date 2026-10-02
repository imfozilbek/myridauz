import { CAR_PHOTO_KINDS, type CarPhotoKind, type PersonId } from '@platform/contracts';
import { Caption } from '@telegram-apps/telegram-ui';
import type { TranslationKey } from '@platform/i18n';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useBlobUrl } from '../media/use-blob-url';
import { Screen } from '../screen/screen';

export type PhotoKind = CarPhotoKind | 'avatar';
const KINDS: readonly PhotoKind[] = ['avatar', ...CAR_PHOTO_KINDS];
const LABELS: Record<PhotoKind, TranslationKey> = {
  avatar: 'moderation.photo.avatar',
  front: 'drivers.photo.front',
  side: 'drivers.photo.side',
  interior: 'drivers.photo.interior',
};

type PhotoProps = { readonly userId: PersonId; readonly kind: PhotoKind };

function usePhoto({ userId, kind }: PhotoProps) {
  const { moderation } = useApiClients();
  return useBlobUrl(() => moderation.photo(userId, kind), `${userId}:${kind}`);
}

function Photo({ userId, kind, onOpen }: PhotoProps & { readonly onOpen: () => void }) {
  const { t } = useI18n();
  const url = usePhoto({ userId, kind });
  return (
    <figure className="moderation-photo">
      <button type="button" className="moderation-photo-open" aria-label={t(LABELS[kind])} onClick={onOpen}>
        {url ? <img src={url} alt={t(LABELS[kind])} /> : <span className="moderation-photo-empty" />}
      </button>
      <Caption className="moderation-caption">{t(LABELS[kind])}</Caption>
    </figure>
  );
}

type GridProps = { readonly userId: PersonId; readonly onOpen: (kind: PhotoKind) => void };

// The face and the car side by side: the moderator compares them with the data (docs/04).
// A tap opens the photo on the whole screen (docs/89 S8).
export function PhotoGrid({ userId, onOpen }: GridProps) {
  return (
    <div className="moderation-grid">
      {KINDS.map((kind) => (
        <Photo key={kind} userId={userId} kind={kind} onOpen={() => onOpen(kind)} />
      ))}
    </div>
  );
}

// One photo on the whole screen: the plate and the face are read without a zoom.
export function PhotoScreen({ userId, kind, onBack }: PhotoProps & { readonly onBack: () => void }) {
  const { t } = useI18n();
  const url = usePhoto({ userId, kind });
  return (
    <div className="moderation-zoom">
      <Screen onBack={onBack} />
      {url ? <img src={url} alt={t(LABELS[kind])} /> : null}
      <Caption className="moderation-caption">{t(LABELS[kind])}</Caption>
    </div>
  );
}
