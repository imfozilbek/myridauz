import { describe, expect, it } from 'vitest';
import { call } from './test-api';
import { testD1 } from './test-d1';

const env = { DB: testD1() };
const DRIVER = 71;
const PASSENGER = 72;
const picture = (type: string) => ({
  method: 'PUT',
  body: new Uint8Array([1, 2, 3]),
  headers: { 'content-type': type },
  env,
});
const json = (body: unknown) => ({
  method: 'POST',
  body: JSON.stringify(body),
  headers: { 'content-type': 'application/json' },
  env,
});

// The API of the loops of growth (G69, docs/123): only with D1, the pictures only for whom they are.
describe('the loops of growth over HTTP', () => {
  it('gives the own links with the code: «Yana ulashish» and the QR', async () => {
    const mine = (await (await call('/me/growth', PASSENGER, { env })).json()) as Record<string, unknown>;
    expect(mine).toMatchObject({ joined: 0, rode: 0 });
    expect(String(mine.link)).toMatch(/startapp=__share-join-[a-z0-9]{6}$/u);
    expect(String(mine.qr)).toMatch(/startapp=__qr-[a-z0-9]{6}$/u);
    expect((await call('/me/growth', PASSENGER)).status).toBe(503);
  });

  it('keeps the QR picture of an approved driver only, a day under a public link', async () => {
    expect((await call('/me/qr', DRIVER, picture('image/png'))).status).toBe(404);
    await env.DB.exec(`INSERT INTO application_log (user_id, status, reasons, decided_by, decided_at)
      VALUES (${DRIVER}, 'approved', '[]', 900, ${Date.now()})`);
    expect((await call('/me/qr', DRIVER, picture('image/jpeg'))).status).toBe(400);
    const saved = await call('/me/qr', DRIVER, picture('image/png'));
    expect(saved.status).toBe(201);
    const { imageUrl } = (await saved.json()) as { imageUrl: string };
    const image = await call(new URL(imageUrl).pathname, DRIVER, { env });
    expect(image.headers.get('content-type')).toBe('image/png');
  });

  it('keeps the story of a moment only after the moment was offered', async () => {
    expect((await call('/me/moment/story', PASSENGER, picture('image/jpeg'))).status).toBe(404);
    expect((await call('/me/moment/offered', PASSENGER, json({ moment: 'nope' }))).status).toBe(400);
    expect((await call('/me/moment/offered', PASSENGER, json({ moment: 'join' }))).status).toBe(204);
    expect((await call('/me/moment/story', PASSENGER, picture('image/jpeg'))).status).toBe(201);
    // A moment the person did not reach: a passenger is no new driver.
    expect((await call('/me/moment/card', PASSENGER, json({ moment: 'driver', phrase: 0 }))).status).toBe(
      404,
    );
    // No moment after a trip any more (owner decision 15.10.2026).
    expect((await call('/me/moment/card', PASSENGER, json({ moment: 'trip1', phrase: 0 }))).status).toBe(400);
    expect((await call('/me/moment?side=nobody', PASSENGER, { env })).status).toBe(400);
  });
});
