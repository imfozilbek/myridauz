// What one team member has: the work of today and when the last one came (null: never).
export type Load = { readonly today: number; readonly lastAt: number | null };

const waited = (load: Load | undefined) => load?.lastAt ?? Number.NEGATIVE_INFINITY;

// Who gets the next question or application (docs/92): the least work today; on a tie, whom
// waited longest (never had any comes first); then the order of the team.
export function pickAssignee(team: readonly number[], loads: ReadonlyMap<number, Load>): number | undefined {
  let best: number | undefined;
  for (const id of team) {
    if (best === undefined) {
      best = id;
      continue;
    }
    const [candidate, current] = [loads.get(id), loads.get(best)];
    const less = (candidate?.today ?? 0) - (current?.today ?? 0);
    if (less < 0 || (less === 0 && waited(candidate) < waited(current))) best = id;
  }
  return best;
}
