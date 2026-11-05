import { tellRequest, tellRequestClosed } from './modules/bookings';
import { requestGroups as groupsOf } from './modules/channels';
import {
  handleRequestChanged,
  handleRequestMatched,
  handleRequestPublished,
  requestFacts,
  requestViewOf,
} from './modules/ride-requests';
import { requestPublished } from './modules/route-subscriptions';
import { inNews } from './news-gate';

// What follows a passenger's request in the other modules, set here like module-events.ts so the
// modules do not depend on each other in circles.
export const requestGroups = groupsOf(requestFacts);

// A published request: its own card waits quietly on top of the passenger bot (G68, docs/122); it
// reaches subscribed drivers (docs/24) and the direction groups of its route (docs/223), unless
// complaints hide the passenger (docs/17).
handleRequestPublished(async (env, requestId) => {
  await tellRequest(env, requestId);
  const request = await requestViewOf(env, requestId);
  if (!request || !(await inNews(env, request.passenger.id))) return;
  await requestPublished(env, request);
  await requestGroups.posted(env, requestId);
});
// A request cancelled or burned: its card says so (G68), the drivers who offered hear it (G75), its
// group posts go (docs/223); matched by an accepted offer, its group posts go too.
handleRequestChanged(async (env, requestId) => {
  await tellRequestClosed(env, requestId);
  await requestGroups.closed(env, requestId);
});
handleRequestMatched((env, requestId) => requestGroups.closed(env, requestId));
