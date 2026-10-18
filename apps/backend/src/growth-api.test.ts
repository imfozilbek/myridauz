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
  it('gives the own QR link with the code; «Yana ulashish» is a card with it (G88)', async () => {
    const mine = (await (await call('/me/growth', PASSENGER, { env })).json()) as Record<string, unknown>;
    expect(mine).toMatchObject({ joined: 0, rode: 0 });
    expect(String(mine.qr)).toMatch(/startapp=__qr-[a-z0-9]{6}$/u);
    const again = await call('/me/loop-card', PASSENGER, json({ loop: 'share-join' }));
    expect(((await again.json()) as { link: string }).link).toMatch(/startapp=__share-join-[a-z0-9]{6}$/u);
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

  it('keeps the picture of a trip card for an approved driver; the card names its picture (G88)', async () => {
    const card = (body: unknown) => call('/me/loop-card', DRIVER, { ...json(body), app: 'driver' });
    expect((await call('/me/card-picture', PASSENGER, picture('image/jpeg'))).status).toBe(404);
    expect((await call('/me/card-picture', DRIVER, picture('image/png'))).status).toBe(400);
    const saved = await call('/me/card-picture', DRIVER, picture('image/jpeg'));
    expect(saved.status).toBe(201);
    const { id } = (await saved.json()) as { id: string };
    expect((await call(`/stories/${id}`, DRIVER, { env })).headers.get('content-type')).toBe('image/jpeg');
    expect((await card({ loop: 'trip', tripId: crypto.randomUUID(), picture: 'evil.uz/x' })).status).toBe(
      400,
    );
    // No such trip of this driver: nothing to send.
    expect((await card({ loop: 'trip', tripId: crypto.randomUUID(), picture: id })).status).toBe(404);
  });

  it('keeps the story of a moment only after the moment was offered', async () => {
    expect((await call('/me/moment/story', DRIVER, picture('image/jpeg'))).status).toBe(404);
    expect((await call('/me/moment/offered', DRIVER, json({ moment: 'nope' }))).status).toBe(400);
    expect((await call('/me/moment/offered', DRIVER, json({ moment: 'driver' }))).status).toBe(204);
    expect((await call('/me/moment/story', DRIVER, picture('image/jpeg'))).status).toBe(201);
    // A moment the person did not reach: a passenger is no new driver, not even after a crafted offer.
    const passenger = (path: string, body: unknown) => call(path, PASSENGER, json(body));
    expect((await passenger('/me/moment/offered', { moment: 'driver' })).status).toBe(404);
    expect((await passenger('/me/moment/card', { moment: 'driver', phrase: 0 })).status).toBe(404);
    expect((await call('/me/moment/story', PASSENGER, picture('image/jpeg'))).status).toBe(404);
    // No moment after a trip nor after the registration any more (owner decisions 15 and 18.10.2026).
    expect((await passenger('/me/moment/card', { moment: 'trip1', phrase: 0 })).status).toBe(400);
    expect((await passenger('/me/moment/offered', { moment: 'join' })).status).toBe(400);
    expect((await call('/me/moment?side=nobody', PASSENGER, { env })).status).toBe(400);
  });
});
