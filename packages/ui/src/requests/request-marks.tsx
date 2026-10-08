import type { PickupMode, RideRequest } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useI18n } from '../context/i18n-context';

const WAYS: Record<PickupMode, TranslationKey> = {
  pitak: 'requests.card.pitak',
  door: 'requests.card.door',
  both: 'way.request.both',
};

// The marks of a request (mockup g64/1): how the passenger is taken in grey, «Boʻsh salon kerak»
// and «Men bilan ayol bor» in amber; the driver sees them before an offer (docs/06, G61).
export function RequestMarks({ request }: { readonly request: RideRequest }) {
  const { t } = useI18n();
  return (
    <div className="request-marks">
      <span className="request-mark">{t(WAYS[request.pickupMode])}</span>
      {request.wholeCar ? (
        <span className="request-mark" data-tone="strong">
          {t('market.request.wholeCar')}
        </span>
      ) : null}
      {request.withWoman ? (
        <span className="request-mark" data-tone="strong">
          {t('find.withWoman')}
        </span>
      ) : null}
    </div>
  );
}
