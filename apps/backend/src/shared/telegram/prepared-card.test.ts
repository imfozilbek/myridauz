import { describe, expect, it } from 'vitest';
import { prepareCard } from './prepared-card';

// What the card asks Telegram to keep: the result of savePreparedInlineMessage (docs/43, G88).
async function kept(photo?: string) {
  const bodies: Record<string, unknown>[] = [];
  const fetch = async (_url: string, init?: RequestInit) => {
    bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return Response.json({ ok: true, result: { id: 'prepared-1' } });
  };
  const words = { title: 'Safarimda boʻsh joy bor', button: 'Joy band qilish' };
  const id = await prepareCard(fetch, '1:token', 7, 'Safar', 'https://t.me/bot?startapp=x', words, photo);
  return { id, result: bodies[0]?.result as Record<string, unknown> };
}

describe('the prepared card of a Mini App', () => {
  it('a card of text by default', async () => {
    const { id, result } = await kept();
    expect(id).toBe('prepared-1');
    expect(result).toMatchObject({ type: 'article', input_message_content: { message_text: 'Safar' } });
  });

  it('the driver trip: the picture with the text under it and the same button (G88)', async () => {
    const photo = 'https://api.test/stories/p1';
    const { result } = await kept(photo);
    expect(result).toMatchObject({ type: 'photo', photo_url: photo, thumbnail_url: photo, caption: 'Safar' });
    expect(JSON.stringify(result.reply_markup)).toContain('Joy band qilish');
  });
});
