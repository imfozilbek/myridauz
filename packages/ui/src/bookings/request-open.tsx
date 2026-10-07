import type { Offer, RideRequest } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { RequestScreen } from '../market/request-card';
import { ActionFailure } from '../states/action-failure';
import { OffersSection } from './offers-section';

type Props = {
  readonly request: RideRequest;
  readonly offers: readonly Offer[];
  readonly failure: TranslationKey | null;
  readonly onBack: () => void;
  readonly onCancel: () => void;
  readonly onOffer: (offer: Offer) => void;
};

// A request of the passenger with the drivers' offers still waiting on it (G08).
export function RequestOpen({ request, offers, failure, onBack, onCancel, onOffer }: Props) {
  const mine = offers.filter((item) => item.requestId === request.id && item.status === 'sent');
  return (
    <RequestScreen request={request} onBack={onBack} onCancel={onCancel}>
      <ActionFailure error={failure} />
      {request.status === 'open' ? <OffersSection offers={mine} onOpen={onOffer} /> : null}
    </RequestScreen>
  );
}
