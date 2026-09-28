import { CAR_PHOTO_KINDS, type CarPhotoKind } from '@platform/contracts';
import { Caption } from '@telegram-apps/telegram-ui';
import type { TranslationKey } from '@platform/i18n';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useBlobUrl } from '../media/use-blob-url';

type Kind = CarPhotoKind | 'avatar';
const KINDS: readonly Kind[] = ['avatar', ...CAR_PHOTO_KINDS];
const LABELS: Record<Kind, TranslationKey> = {
  avatar: 'moderation.photo.avatar',
  front: 'drivers.photo.front',
  side: 'drivers.photo.side',
  interior: 'drivers.photo.interior',
};

function Photo({ userId, kind }: { readonly userId: number; readonly kind: Kind }) {
  const { moderation } = useApiClients();
  const { t } = useI18n();
  const url = useBlobUrl(() => moderation.photo(userId, kind), `${userId}:${kind}`);
  return (
    <figure className="moderation-photo">
      {url ? <img src={url} alt={t(LABELS[kind])} /> : <span className="moderation-photo-empty" />}
      <Caption className="moderation-caption">{t(LABELS[kind])}</Caption>
    </figure>
  );
}

// The face and the car side by side: the moderator compares them with the data (docs/04).
export function PhotoGrid({ userId }: { readonly userId: number }) {
  return (
    <div className="moderation-grid">
      {KINDS.map((kind) => (
        <Photo key={kind} userId={userId} kind={kind} />
      ))}
    </div>
  );
}
