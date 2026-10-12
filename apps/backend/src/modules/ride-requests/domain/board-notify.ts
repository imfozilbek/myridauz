type Way = { readonly from: string; readonly to: string };

// «Xabar bering» of an empty board (G78 sheet 3): the route of a link, else the first direction of
// the driver's trips; by regions, as the board reads them. None once a subscription covers it.
export function notifyRoute(
  route: Way | null,
  directions: readonly Way[],
  subscribed: readonly Way[],
  regionOf: (id: string) => string,
): Way | null {
  const same = (a: Way, b: Way) => regionOf(a.from) === regionOf(b.from) && regionOf(a.to) === regionOf(b.to);
  const covered = (way: Way) => subscribed.some((one) => same(one, way));
  if (route) return covered(route) ? null : route;
  const way = directions.find((one) => !covered(one));
  return way ? { from: regionOf(way.from), to: regionOf(way.to) } : null;
}
