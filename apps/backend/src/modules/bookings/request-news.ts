import { isQuietTime, type Offer } from '@platform/contracts';
import type { Bindings } from '../../env';
import { placesOf } from '../locations';
import { showCards } from '../notifications';
import type { BookingsDeps } from './application/ports';
import { expiredRing, firstOfferRing, requestCard } from './infrastructure/request-card';
import { brandOf } from '../../shared/brand/brand-of';

// The request card of the passenger bot (G68, docs/122): a request published, offered, answered,
// cancelled or burned shows it again; the first offer rings under it, the next ones only count. A
// burned one rings with the search (G46): only its change brings it here, so it rings once.
export const requestNewsOf =
  (env: Bindings, deps: BookingsDeps) => async (requestId: string, offer?: Offer) => {
    const request = await deps.requests.find(requestId);
    if (!request) return;
    const waiting = (await deps.offers.byRequests([requestId])).filter((sent) => sent.status === 'sent');
    const now = deps.now();
    const brand = brandOf(env);
    const card = requestCard({ brand, request, offers: waiting.length, places: await placesOf(env), now });
    const quiet = isQuietTime(now);
    const first = offer && waiting.length === 1 ? [firstOfferRing(brand, request, offer, quiet)] : [];
    const burned = !offer && request.status === 'expired' ? [expiredRing(brand, request, now, quiet)] : [];
    await showCards(env, [card], [...first, ...burned]);
  };
