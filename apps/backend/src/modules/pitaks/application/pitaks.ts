import type { Pitak } from '@platform/contracts';
import { shown, type PitakRecord } from '../domain/pitak';
import type { PitaksDeps } from './ports';

export const pitakView = (pitak: PitakRecord): Pitak => ({
  id: pitak.id,
  name: pitak.name,
  point: pitak.point,
});

// The pitak of a direction as people see it (docs/70): the main one, only when shown; otherwise
// the direction has no «Pitakdan», only «from the door».
export async function pitakOfDirection(deps: PitaksDeps, from: string, to: string): Promise<Pitak | null> {
  const direction = await deps.store.direction(from, to);
  const pitak = direction?.pitakId ? await deps.store.find(direction.pitakId) : undefined;
  return pitak && shown(pitak) ? pitakView(pitak) : null;
}
