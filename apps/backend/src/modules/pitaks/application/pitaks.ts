import type { Pitak } from '@platform/contracts';
import { toCyrillic } from '@platform/i18n';
import { shown, type PitakRecord } from '../domain/pitak';
import type { PitaksDeps } from './ports';

// The team writes the name and the hint in Latin; people read them in Cyrillic (G98, docs/228).
export const pitakView = (pitak: PitakRecord): Pitak => ({
  id: pitak.id,
  name: toCyrillic(pitak.name),
  point: pitak.point,
  hint: pitak.hint && toCyrillic(pitak.hint),
});

// The pitak of a direction as people see it (docs/70): the main one, only when shown; otherwise
// the direction has no «Pitakdan», only «from the door».
export async function pitakOfDirection(deps: PitaksDeps, from: string, to: string): Promise<Pitak | null> {
  const direction = await deps.store.direction(from, to);
  const pitak = direction?.pitakId ? await deps.store.find(direction.pitakId) : undefined;
  return pitak && shown(pitak) ? pitakView(pitak) : null;
}
