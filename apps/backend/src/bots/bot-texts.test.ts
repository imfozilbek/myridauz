import { describe, expect, it } from 'vitest';
import { setTextsWhenChanged } from './bot-texts';

const PROFILE = { name: 'Brend | yoʻlovchi', description: 'Matn', short_description: 'Qisqa' };

// Telegram as it is now: what each get answers; every call is kept by its method.
function telegram(seen: Record<string, object>) {
  const calls: { method: string; body: unknown }[] = [];
  const fetch = async (url: string, init?: RequestInit) => {
    const method = url.split('/').pop() ?? '';
    calls.push({ method, body: JSON.parse(String(init?.body)) });
    return Response.json({ ok: true, result: seen[method] ?? true });
  };
  return { fetch, sets: () => calls.filter((call) => call.method.startsWith('set')) };
}

// Lesson 308: the Cron sent the same name every 15 minutes, and Telegram answered 429 each time.
describe('the texts of a bot', () => {
  it('sends nothing when Telegram already has the same texts', async () => {
    const { fetch, sets } = telegram({
      getMyName: { name: PROFILE.name },
      getMyDescription: { description: PROFILE.description },
      getMyShortDescription: { short_description: PROFILE.short_description },
    });
    await setTextsWhenChanged(fetch, 'p', PROFILE);
    expect(sets()).toEqual([]);
  });

  it('sends only the text that differs', async () => {
    const { fetch, sets } = telegram({
      getMyName: { name: 'Eski nom' },
      getMyDescription: { description: PROFILE.description },
      getMyShortDescription: { short_description: PROFILE.short_description },
    });
    await setTextsWhenChanged(fetch, 'p', PROFILE);
    expect(sets()).toEqual([{ method: 'setMyName', body: { name: PROFILE.name } }]);
  });
});
