import './moderation.css';
import type { CarPhotoKind, PersonId } from '@platform/contracts';
import { Caption } from '@telegram-apps/telegram-ui';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useBlobUrl } from '../media/use-blob-url';
import { Screen } from '../screen/screen';

type PhotoProps = { readonly userId: PersonId; readonly kind: CarPhotoKind; readonly onBack: () => void };

// One car photo of an application on the whole screen: the plate is read without a zoom (docs/89 S8).
export function PhotoScreen({ userId, kind, onBack }: PhotoProps) {
  const { t } = useI18n();
  const { moderation } = useApiClients();
  const url = useBlobUrl(() => moderation.photo(userId, kind), `${userId}:${kind}`);
  const label = t(`drivers.photo.${kind}`);
  return (
    <div className="moderation-zoom">
      <Screen onBack={onBack} />
      {url ? <img src={url} alt={label} /> : null}
      <Caption className="moderation-caption">{label}</Caption>
    </div>
  );
}
