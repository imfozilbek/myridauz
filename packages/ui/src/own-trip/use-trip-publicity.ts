import { quietly } from '@platform/api-client';
import type { TripPublicity } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';

// The channels of a published trip, the people who opened it and its link (G63 B3, docs/119):
// asked quietly, without the top loader (docs/121 §3); on an error the card stays away.
export function useTripPublicity(tripId: string): TripPublicity | null {
  const { channels } = useApiClients();
  const [publicity, setPublicity] = useState<TripPublicity | null>(null);
  useEffect(() => {
    let open = true;
    quietly(() => channels.tripPublicity(tripId)).then(
      (fresh) => {
        if (open) setPublicity(fresh);
      },
      () => undefined,
    );
    return () => {
      open = false;
    };
  }, [channels, tripId]);
  return publicity;
}
