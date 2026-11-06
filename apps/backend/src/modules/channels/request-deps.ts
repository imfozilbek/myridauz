import type { Bindings } from '../../env';
import { placesOf } from '../locations';
import { notifyMass } from '../notifications';
import { brandOf } from '../../shared/brand/brand-of';
import {
  closeRequestPosts,
  postRequest,
  rememberRequestPost,
  type GroupRequest,
  type PostBot,
  type RequestPostsDeps,
} from './application/request-posts';
import { allChannels } from './application/team';
import { groupLookOf } from './channels-deps';
import { closedRequestPost, groupRequestPost } from './infrastructure/group-request';
import { createMemoryRequestPosts, d1RequestPosts } from './infrastructure/request-posts';
import { teamDeps } from './team-deps';

const localPosts = createMemoryRequestPosts();

// The request as the group shows it: set by the app, so channels does not depend on ride-requests.
type RequestOf = (env: Bindings, id: string) => Promise<GroupRequest | undefined>;
type Run = (deps: RequestPostsDeps) => Promise<void>;

// A brand without a look of its groups posts no requests at all (docs/223).
function withDeps(env: Bindings, requestOf: RequestOf, run: Run): Promise<void> {
  const brand = brandOf(env);
  const look = groupLookOf(brand);
  if (!look) return Promise.resolve();
  return run({
    enabled: env.CHANNEL_POSTS === 'on',
    groups: look.chats,
    // The group's own bot once its key is on the Worker (owner, 06.11.2026: «элончи писал не постер»).
    bot: env.GROUP_BOT_TOKEN ? 'group' : 'poster',
    channels: async () => allChannels(await teamDeps(env)),
    places: () => placesOf(env),
    request: (id) => requestOf(env, id),
    posts: env.DB ? d1RequestPosts(env.DB) : localPosts,
    render: groupRequestPost(brand.bots.driver, look),
    closed: closedRequestPost(look),
    send: (jobs) => notifyMass(env, jobs),
    now: () => Date.now(),
  });
}

// The requests of passengers in the direction groups (docs/223): posted, remembered, closed.
export const requestGroups = (requestOf: RequestOf) => ({
  posted: (env: Bindings, id: string) => withDeps(env, requestOf, (deps) => postRequest(deps, id)),
  closed: (env: Bindings, id: string) => withDeps(env, requestOf, (deps) => closeRequestPosts(deps, id)),
  remember: (env: Bindings, post: { requestId: string; chat: string; bot?: PostBot }, messageId: number) =>
    withDeps(env, requestOf, (deps) =>
      rememberRequestPost(deps, {
        requestId: post.requestId,
        chat: post.chat,
        messageId,
        bot: post.bot ?? 'poster',
      }),
    ),
});
