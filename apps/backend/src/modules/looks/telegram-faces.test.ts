import { describe, expect, it } from 'vitest';
import { channelFace, posterFace } from './infrastructure/telegram-faces';

type Call = { readonly method: string; readonly body: Record<string, unknown> };
const LOOK = { name: 'Brend | Boʻka', description: 'Matn' };
const PICTURE = new Uint8Array([255, 216, 255]).buffer;

// The Bot API in memory: the answers by method, every call with its fields (a file as its size).
function telegram(answers: Readonly<Record<string, unknown>>) {
  const calls: Call[] = [];
  const call = async (url: string, init?: RequestInit) => {
    const method = url.split('/').at(-1) ?? '';
    const body =
      init?.body instanceof FormData
        ? Object.fromEntries(
            [...init.body.entries()].map(([key, value]) => [
              key,
              typeof value === 'string' ? value : value.size,
            ]),
          )
        : (JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>);
    calls.push({ method, body });
    return Response.json({ ok: true, result: answers[method] ?? true });
  };
  return { call, calls };
}

// docs/180: the calls that read and set the look of a channel and of their bot.
describe('the faces in Telegram', () => {
  it('reads and sets only the name of the bot of the channels', async () => {
    const { call, calls } = telegram({ getMyName: { name: 'Brend | poster' } });
    const face = posterFace(call, '9:poster', { name: 'Brend | poster' });
    expect(face.key).toBe('bot:poster');
    expect(await face.read()).toEqual({ name: 'Brend | poster', description: null, photo: null });
    await face.write('name', 'Yangi | poster');
    expect(face.photo).toBeUndefined();
    expect(calls.map(({ method, body }) => [method, body])).toEqual([
      ['getMyName', {}],
      ['setMyName', { name: 'Yangi | poster' }],
    ]);
  });

  it('reads a channel in one call and sets its title, description and photo', async () => {
    const { call, calls } = telegram({
      getChat: { title: 'Brend | Boʻka', photo: { small_file_unique_id: 's', big_file_unique_id: 'b' } },
    });
    const face = channelFace(call, '9:poster', '-100123', LOOK);
    expect(face.key).toBe('channel:-100123');
    expect(await face.read()).toEqual({ name: 'Brend | Boʻka', description: null, photo: 'b' });
    await face.write('name', 'Yangi');
    await face.write('description', 'Tavsif');
    expect(await face.photo?.(PICTURE)).toBe('b');
    expect(calls.slice(1).map(({ method, body }) => [method, body])).toEqual([
      ['setChatTitle', { chat_id: '-100123', title: 'Yangi' }],
      ['setChatDescription', { chat_id: '-100123', description: 'Tavsif' }],
      ['setChatPhoto', { chat_id: '-100123', photo: PICTURE.byteLength }],
      ['getChat', { chat_id: '-100123' }],
    ]);
  });

  it('fails a call Telegram refused without the token in the error', async () => {
    const face = channelFace(async () => new Response('{}', { status: 400 }), '9:poster', '@x', LOOK);
    await expect(face.write('name', 'Yangi')).rejects.toThrow('telegram.setChatTitle_400');
    await expect(face.photo?.(PICTURE)).rejects.toThrow('telegram.setChatPhoto_400');
    await expect(face.read()).rejects.not.toThrow(/poster/u);
  });
});
