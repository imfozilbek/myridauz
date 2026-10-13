import { describe, expect, it } from 'vitest';
import { botFace, channelFace } from './infrastructure/telegram-faces';

type Call = { readonly method: string; readonly body: Record<string, unknown> };
const LOOK = { name: 'Brend | yoʻlovchi', description: 'Matn', short: 'Qisqa' };
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

// docs/180: the calls that read and set the look of a bot and of a channel.
describe('the faces in Telegram', () => {
  it('reads the name, the texts and the photo of a bot by its own id', async () => {
    const { call, calls } = telegram({
      getMyName: { name: 'Brend | yo’lovchi' },
      getMyDescription: { description: 'Matn' },
      getMyShortDescription: { short_description: '' },
      getUserProfilePhotos: { photos: [[{ file_unique_id: 'small' }, { file_unique_id: 'big' }]] },
    });
    const face = botFace(call, '777:secret', 'bot:passenger', LOOK);
    expect(await face.read()).toEqual({
      name: 'Brend | yo’lovchi',
      description: 'Matn',
      short: '',
      photo: 'big',
    });
    expect(calls.find((one) => one.method === 'getUserProfilePhotos')?.body).toEqual({
      user_id: 777,
      limit: 1,
    });
  });

  it('sets the texts of a bot and uploads its picture', async () => {
    const { call, calls } = telegram({ getUserProfilePhotos: { photos: [[{ file_unique_id: 'new' }]] } });
    const face = botFace(call, '777:secret', 'bot:passenger', LOOK);
    await face.write('name', LOOK.name);
    await face.write('short', LOOK.short);
    expect(await face.photo(PICTURE)).toBe('new');
    expect(calls.map(({ method }) => method)).toEqual([
      'setMyName',
      'setMyShortDescription',
      'setMyProfilePhoto',
      'getUserProfilePhotos',
    ]);
    expect(calls[1]?.body).toEqual({ short_description: 'Qisqa' });
    expect(calls[2]?.body).toEqual({
      photo: JSON.stringify({ type: 'static', photo: 'attach://picture' }),
      picture: PICTURE.byteLength,
    });
  });

  it('reads a channel in one call and sets its title, description and photo', async () => {
    const { call, calls } = telegram({
      getChat: { title: 'Brend | Boʻka', photo: { small_file_unique_id: 's', big_file_unique_id: 'b' } },
    });
    const face = channelFace(call, '9:poster', '-100123', LOOK);
    expect(face.key).toBe('channel:-100123');
    expect(await face.read()).toEqual({ name: 'Brend | Boʻka', description: null, short: null, photo: 'b' });
    await face.write('name', 'Yangi');
    await face.write('description', 'Tavsif');
    expect(await face.photo(PICTURE)).toBe('b');
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
    await expect(face.read()).rejects.not.toThrow(/poster/u);
  });
});
