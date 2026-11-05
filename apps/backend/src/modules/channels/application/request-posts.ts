import type { NotificationJob } from '../../notifications';
import { channelsOf, type ChannelCoverage } from '../domain/route-channels';

// A passenger's request of the Mini App as a direction group shows it (docs/223).
export type GroupRequest = {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly date: string;
  readonly seats: number;
  readonly price: number;
  readonly wholeCar: boolean;
  readonly open: boolean;
};
export type RequestPost = { readonly requestId: string; readonly chat: string; readonly messageId: number };
export type RequestPostStore = {
  save(post: RequestPost): Promise<void>;
  of(requestId: string): Promise<RequestPost[]>;
  forget(requestId: string): Promise<void>;
};

type Place = { readonly name: string; readonly parentId: string | null };
type Places = ReadonlyMap<string, Place>;
type Shown = { readonly text: string; readonly markup: object };

export type RequestPostsDeps = {
  // Only when the posts of the trips are on (docs/33), only into the groups with a look of their own.
  readonly enabled: boolean;
  readonly groups: ReadonlySet<string>;
  readonly channels: () => Promise<readonly ChannelCoverage[]>;
  readonly places: () => Promise<Places>;
  readonly request: (id: string) => Promise<GroupRequest | undefined>;
  readonly posts: RequestPostStore;
  readonly render: (request: GroupRequest, places: Places, now: number, chat: string) => Shown;
  readonly closed: () => Shown;
  readonly send: (jobs: readonly NotificationJob[]) => Promise<void>;
  readonly now: () => number;
};

// A new request goes to the groups of its route, without sound, as a trip does (docs/222, docs/223);
// the channels never get requests (docs/15).
export async function postRequest(deps: RequestPostsDeps, requestId: string): Promise<void> {
  if (!deps.enabled || deps.groups.size === 0) return;
  const [request, places, list] = await Promise.all([
    deps.request(requestId),
    deps.places(),
    deps.channels(),
  ]);
  if (!request?.open) return;
  const chats = channelsOf(request.from, request.to, places, list).filter((chat) => deps.groups.has(chat));
  await deps.send(
    chats.map((chat) => ({
      bot: 'poster' as const,
      chatId: chat,
      html: true,
      silent: true,
      ...deps.render(request, places, deps.now(), chat),
      after: { type: 'requestPost' as const, requestId, chat },
    })),
  );
}

// Matched, cancelled or over: each post says so and is deleted; Telegram keeps a post older than 48
// hours, then it stays with the words that the request closed.
export async function closeRequestPosts(deps: RequestPostsDeps, requestId: string): Promise<void> {
  const posts = await deps.posts.of(requestId);
  if (posts.length === 0) return;
  const { text, markup } = deps.closed();
  await deps.send(
    posts.flatMap((post) => {
      const shown = {
        bot: 'poster' as const,
        chatId: post.chat,
        html: true,
        edit: post.messageId,
        text,
        markup,
      };
      return [shown, { ...shown, remove: true }];
    }),
  );
  await deps.posts.forget(requestId);
}

// Telegram gave the post its id. A request that closed while the post waited in the queue closes it
// at once: nothing else would.
export async function rememberRequestPost(deps: RequestPostsDeps, post: RequestPost): Promise<void> {
  await deps.posts.save(post);
  if (!(await deps.request(post.requestId))?.open) await closeRequestPosts(deps, post.requestId);
}
