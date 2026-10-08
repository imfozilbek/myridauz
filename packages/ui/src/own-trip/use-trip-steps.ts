import type { Trip } from '@platform/contracts';
import { useRef } from 'react';
import { useApiClients } from '../context/api-clients';
import { useFailure } from '../states/use-failure';
import { haptic } from '../telegram/feedback';
import type { TripStep } from './trip-stage';

type Options = {
  readonly trip: Trip;
  // The page shows the fresh trip (docs/64).
  readonly onChanged: () => void;
  // «Yetib keldik» went through: «Safar tugadi» opens once (docs/124 В).
  readonly onArrived: () => void;
};

// «Yoʻlga chiqdim» and «Yetib keldik» of the driver on the server (G63 B1, docs/35). Each step goes
// once: a second tap while it is sent, or after it went, sends nothing (docs/65 B4). A failure keeps
// the page with the reason of the server.
export function useTripSteps({ trip, onChanged, onArrived }: Options) {
  const { market } = useApiClients();
  const { failure, fail, clear } = useFailure();
  const sent = useRef(new Set<TripStep>());
  const step = async (next: TripStep) => {
    if (sent.current.has(next)) return;
    sent.current.add(next);
    clear();
    try {
      await (next === 'departed' ? market.departTrip(trip.id) : market.arriveTrip(trip.id));
      haptic.success();
      onChanged();
      if (next === 'arrived') onArrived();
    } catch (caught) {
      sent.current.delete(next);
      fail(caught);
    }
  };
  return { step, failure };
}
