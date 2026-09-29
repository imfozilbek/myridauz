import {
  callConnectInputSchema,
  callPullInputSchema,
  callRenegotiateInputSchema,
  chatKeySchema,
  type ApiErrorCode,
} from '@platform/contracts';
import { Hono, type Context } from 'hono';
import type { z } from 'zod';
import type { AppEnv, Bindings } from '../../../env';
import type { Realtime } from '../application/ports';

// May this person call in this chat (docs/08): a member of a confirmed booking.
export type CanCall = (env: Bindings, key: string, userId: number) => Promise<boolean>;

const STATUS = { 'calls.not_allowed': 403, 'calls.invalid_input': 400, 'calls.unavailable': 503 } as const;
const fail = (code: keyof typeof STATUS & ApiErrorCode) =>
  Response.json({ error: code }, { status: STATUS[code] });

// The Mini App talks to Realtime through here: the app secret stays in the Worker (docs/32).
export function callRoutes(canCall: CanCall, realtimeOf: (env: Bindings) => Realtime | null) {
  async function guarded<S extends z.ZodType, R>(
    context: Context<AppEnv>,
    schema: S,
    run: (realtime: Realtime, input: z.infer<S>) => Promise<R>,
  ) {
    const key = context.req.param('key') ?? '';
    const input = schema.safeParse(await context.req.json().catch(() => ({})));
    if (!chatKeySchema.safeParse(key).success || !input.success) return fail('calls.invalid_input');
    if (!(await canCall(context.env, key, context.get('session').user.id))) return fail('calls.not_allowed');
    const realtime = realtimeOf(context.env);
    if (!realtime) return fail('calls.unavailable');
    try {
      return context.json(await run(realtime, input.data));
    } catch {
      return fail('calls.unavailable');
    }
  }
  const anything = callConnectInputSchema.partial();
  return new Hono<AppEnv>()
    .post('/calls/:key/ice', (context) => guarded(context, anything, (realtime) => realtime.iceServers()))
    .post('/calls/:key/connect', (context) =>
      guarded(context, callConnectInputSchema, (realtime, input) =>
        realtime.connect(input.offer, input.mid, input.trackName),
      ),
    )
    .post('/calls/:key/pull', (context) =>
      guarded(context, callPullInputSchema, async (realtime, input) => ({
        offer: await realtime.pull(input.sessionId, input.remote),
      })),
    )
    .post('/calls/:key/renegotiate', (context) =>
      guarded(context, callRenegotiateInputSchema, async (realtime, input) => {
        await realtime.renegotiate(input.sessionId, input.answer);
        return { ok: true };
      }),
    );
}
