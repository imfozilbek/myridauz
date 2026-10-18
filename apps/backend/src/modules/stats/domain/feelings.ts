import type { Feelings } from '@platform/contracts';

// What the reviews and complaints of a period say (G87 V2, docs/191): numbers only, no names, no text.
export type FeelingRows = {
  readonly reviews: number;
  readonly starsSum: number;
  readonly low: number;
  readonly tags: readonly { readonly tag: string; readonly count: number }[];
  // The reasons of each complaint, joined by a comma (complaints/infrastructure/complaint-row.ts).
  readonly reasons: readonly string[];
};

const TOP = 5;
const top = (counts: ReadonlyMap<string, number>) =>
  [...counts].sort((one, other) => other[1] - one[1] || one[0].localeCompare(other[0])).slice(0, TOP);

// The average stars with one decimal, the share of 1 and 2 stars in percent, the five most chosen
// tags and the five most given reasons of complaints.
export function feelingsOf(rows: FeelingRows): Feelings {
  const reasons = new Map<string, number>();
  for (const reason of rows.reasons.flatMap((joined) => joined.split(',')).filter(Boolean))
    reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
  const tags = new Map(rows.tags.map(({ tag, count }) => [tag, count]));
  return {
    reviews: rows.reviews,
    average: rows.reviews > 0 ? Math.round((rows.starsSum / rows.reviews) * 10) / 10 : null,
    lowShare: rows.reviews > 0 ? Math.round((rows.low / rows.reviews) * 100) : 0,
    tags: top(tags).map(([tag, count]) => ({ tag, count })),
    reasons: top(reasons).map(([reason, count]) => ({ reason, count })),
  };
}
