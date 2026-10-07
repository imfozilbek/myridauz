import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { call, pid, registerUser } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());

const OWNER = 900;
const PERSON = 611;
const OTHER = 612;
const photo = { method: 'PUT', body: new Uint8Array(9), headers: { 'content-type': 'image/jpeg' } };
const asTeam = (init: RequestInit = {}) => ({ app: 'admin', ...init });
const decide = (body: object) =>
  asTeam({ method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
const profileOf = async (id: number) =>
  ((await (await call('/me', id)).json()) as { profile: Record<string, unknown> }).profile;

describe('the face photo check over HTTP (docs/118, G51)', () => {
  it('sends a new photo to the team as a card with buttons, and does not stop the person', async () => {
    await registerUser(PERSON);
    expect((await call('/me/avatar', PERSON, photo)).status).toBe(204);
    expect(await profileOf(PERSON)).toMatchObject({
      hasAvatar: true,
      avatarStatus: 'pending',
      avatarReason: null,
    });
    const card = telegram.calls.find((sent) => sent.method === 'sendPhoto' && sent.body.chat_id === OWNER);
    expect(card?.body).toMatchObject({
      photo: 'file',
      caption: expect.stringContaining('Yangi yuz rasmi: Ali'),
    });
    expect(String(card?.body.reply_markup)).toContain(`"callback_data":"face:${PERSON}:ok"`);
    // Others see a person without a photo until the team approves it.
    const shown = await (await call(`/users/${await pid(PERSON)}`, OTHER)).json();
    expect(shown).toMatchObject({ hasAvatar: false });
  });

  it('gives the queue and the photo only to the team', async () => {
    expect((await call('/admin/faces', PERSON, asTeam())).status).toBe(403);
    const queue = (await (await call('/admin/faces', OWNER, asTeam())).json()) as {
      faces: { userId: string }[];
    };
    expect(queue.faces.map((face) => face.userId)).toContain(await pid(PERSON));
    const image = await call(`/admin/faces/${await pid(PERSON)}/photo`, OWNER, asTeam());
    expect([image.status, image.headers.get('content-type')]).toEqual([200, 'image/jpeg']);
    expect((await call('/admin/faces/abc/photo', OWNER, asTeam())).status).toBe(404);
  });

  it('rejects with a reason: the passenger bot asks for a new photo, once', async () => {
    const path = `/admin/faces/${await pid(PERSON)}/decision`;
    expect((await call(path, OWNER, decide({ action: 'reject' }))).status).toBe(400);
    expect((await call(path, OWNER, decide({ action: 'reject', reason: 'face_not_visible' }))).status).toBe(
      204,
    );
    const told = telegram.sentTo(PERSON).at(-1);
    expect(told?.token).toBe('1:passenger');
    expect(told?.body.text).toContain('Sababi: Yuz aniq koʻrinmaydi.');
    expect(JSON.stringify(told?.body.reply_markup)).toContain('?profile=photo');
    expect(await profileOf(PERSON)).toMatchObject({
      avatarStatus: 'rejected',
      avatarReason: 'face_not_visible',
    });
    expect(await (await call(path, OWNER, decide({ action: 'approve' }))).json()).toEqual({
      error: 'users.face_decided',
    });
  });

  it('approves a new photo: others see it, the person hears nothing', async () => {
    await call('/me/avatar', PERSON, photo);
    const before = telegram.sentTo(PERSON).length;
    const path = `/admin/faces/${await pid(PERSON)}/decision`;
    expect((await call(path, OWNER, decide({ action: 'approve' }))).status).toBe(204);
    expect(telegram.sentTo(PERSON)).toHaveLength(before);
    expect(await (await call(`/users/${await pid(PERSON)}`, OTHER)).json()).toMatchObject({
      hasAvatar: true,
    });
    expect(await profileOf(PERSON)).toMatchObject({ avatarStatus: 'approved' });
  });
});
