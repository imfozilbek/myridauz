import { MY_CHANNELS_PATH } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { myChannels, type MyChannelsDeps } from '../application/my-channels';

// «Kanallar» of «Profil» in both apps (G65, docs/119).
export const myChannelsRoutes = (deps: (env: Bindings) => MyChannelsDeps) =>
  new Hono<AppEnv>().get(MY_CHANNELS_PATH, async (context) =>
    context.json({ channels: await myChannels(deps(context.env), context.get('session').user.id) }),
  );
