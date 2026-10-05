import { afterAll, describe, expect, it, vi } from 'vitest';
import { pid, registerUser, testEnv } from '../../../test-api';
import { botSignals } from './bot-signals';

const sent: { chatId: unknown; text: unknown }[] = [];
vi.stubGlobal('fetch', async (_input: string, init?: RequestInit) => {
  const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {};
  sent.push({ chatId: body.chat_id, text: body.text });
  return Response.json({ ok: true, result: { message_id: 1 } });
});
afterAll(() => vi.unstubAllGlobals());

const PERSON = 91;
const TEAM = 900;

describe('the contact attempts signal (docs/07)', () => {
  it('shows the team the public id, never the Telegram ID (docs/65 A3)', async () => {
    await registerUser(PERSON);
    sent.length = 0;
    await botSignals(testEnv).contactAttempts(PERSON, 'bx', 3);
    const text = String(sent.find((message) => message.chatId === TEAM)?.text);
    expect(text).toContain(`ID ${await pid(PERSON)})`);
    expect(text).not.toContain(`ID ${PERSON})`);
  });
});
