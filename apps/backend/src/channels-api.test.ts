import { loadBrand } from '@platform/brands';
import type { Channel, Location } from '@platform/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { app } from './app';
import { localLocations } from './modules/locations';
import { initDataFor } from './shared/auth/test-signing';

const env = { PASSENGER_BOT_TOKEN: '1:passenger', ADMIN_BOT_TOKEN: '3:admin', ADMIN_TELEGRAM_IDS: '900' };
const place = (id: string, parentId: string | null): Location => ({
  id,
  parentId,
  type: parentId ? 'district' : 'region',
  name: id === '1710224' ? 'Kitob' : id,
  lat: 39,
  lng: 66,
  oneCity: false,
});
localLocations.load([place('1710', null), place('1710224', '1710'), place('1710245', '1710')]);

// The bot is an admin of every channel but "ch_nobot" (Telegram getChatMember).
const telegram = (status: string) =>
  vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    expect(String(input)).toContain('/getChatMember');
    const chat = JSON.parse(String(init?.body)).chat_id as string;
    return Response.json({ ok: true, result: { status: chat === '@ch_nobot' ? 'left' : status } });
  });

async function call(path: string, id: number, init: RequestInit = {}) {
  const headers = {
    authorization: `tma ${await initDataFor(env.ADMIN_BOT_TOKEN, id, Math.floor(Date.now() / 1000))}`,
    'x-mini-app': 'admin',
    'content-type': 'application/json',
  };
  return app.request(`/admin/channels${path}`, { ...init, headers }, env);
}
const put = (username: string, body: object) =>
  call(`/${username}`, 900, { method: 'PUT', body: JSON.stringify(body) });
const kitob = { title: 'Kanal | Kitob', places: ['1710224', '1710245', '1710224'] };

afterEach(() => vi.unstubAllGlobals());

describe('channels of the team (docs/63)', () => {
  it('shows the region channels of the brand to the team only', async () => {
    expect((await call('', 5)).status).toBe(403);
    const { channels } = (await (await call('', 900)).json()) as { channels: Channel[] };
    expect(channels.filter((channel) => channel.fixed)).toHaveLength(loadBrand().channels.length);
  });

  it('adds a district channel once the bot is its admin, and removes it', async () => {
    vi.stubGlobal('fetch', telegram('administrator'));
    expect((await put('ch_nobot', kitob)).status).toBe(422);
    expect((await put('ab', kitob)).status).toBe(400);
    expect((await put('ch_kitob', { ...kitob, places: ['1799999'] })).status).toBe(404);
    expect((await put(loadBrand().channels[0]?.username ?? '', kitob)).status).toBe(400);
    const saved = await put('ch_kitob', kitob);
    expect(await saved.json()).toEqual({
      ...kitob,
      username: 'ch_kitob',
      places: ['1710224', '1710245'],
      fixed: false,
    });
    const { channels } = (await (await call('', 900)).json()) as { channels: Channel[] };
    expect(channels.at(-1)?.username).toBe('ch_kitob');
    expect((await call('/ch_kitob', 900, { method: 'DELETE' })).status).toBe(204);
    expect((await call('/ch_kitob', 900, { method: 'DELETE' })).status).toBe(404);
  });

  it('refuses a channel where the bot is only a member', async () => {
    vi.stubGlobal('fetch', telegram('member'));
    expect((await put('ch_kitob', kitob)).status).toBe(422);
  });
});
