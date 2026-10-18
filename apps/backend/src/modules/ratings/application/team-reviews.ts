import { ADMIN_REVIEWS_PAGE, type AdminReviews } from '@platform/contracts';
import type { RatingsDeps } from './ports';

// «Sharhlar» of the team (G45, docs/24): the newest reviews before a moment, the blind and the hidden
// ones too, so the team hides a rude one before anybody reads it. People by the public id (docs/65 A3).
export async function teamReviews(deps: RatingsDeps, before: number): Promise<AdminReviews> {
  const found = await deps.store.latest(before, ADMIN_REVIEWS_PAGE + 1);
  const page = found.slice(0, ADMIN_REVIEWS_PAGE);
  const ids = [...new Set(page.flatMap((review) => [review.raterId, review.rateeId]))];
  const [names, publicIds] = await Promise.all([
    deps.names(ids),
    Promise.all(ids.map(async (id) => [id, await deps.people.publicId(id)] as const)),
  ]);
  const known = new Map(publicIds);
  const person = (id: number) => {
    const publicId = known.get(id);
    return publicId ? { id: publicId, firstName: names.get(id) ?? '' } : null;
  };
  const reviews = page.flatMap((review) => {
    const [author, about] = [person(review.raterId), person(review.rateeId)];
    if (!author || !about) return [];
    const { id, stars, text, hidden, createdAt: at } = review;
    return [{ id, author, about, stars, tags: [...review.tags], text, hidden, at }];
  });
  return { reviews, more: found.length > ADMIN_REVIEWS_PAGE };
}
