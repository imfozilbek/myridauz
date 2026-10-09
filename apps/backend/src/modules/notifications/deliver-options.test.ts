import { describe, expect, it } from 'vitest';
import { deliver } from './application/deliver';
import type { NotificationJob } from './application/job';

const TOKENS = { passenger: 'p', driver: 'd', admin: 'a' };
const JOB: NotificationJob = { bot: 'passenger', chatId: 5, text: '<b>Bugun 08:30</b>', html: true };

// What Telegram got: the body of the one call.
async function sent(job: NotificationJob, status = 200, answer: object = { result: { message_id: 3 } }) {
  const bodies: Record<string, unknown>[] = [];
  const fetch = async (_input: string, init?: RequestInit) => {
    bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return Response.json(answer, { status });
  };
  const delivery = await deliver(fetch, TOKENS, job);
  return { delivery, body: bodies[0] };
}

describe('how a bot message sounds and looks (G68, docs/122)', () => {
  it('a card update and the night come without sound', async () => {
    const { body } = await sent({ ...JOB, silent: true });
    expect(body).toMatchObject({ disable_notification: true, parse_mode: 'HTML' });
    expect((await sent(JOB)).body).not.toHaveProperty('disable_notification');
  });

  it('a short news answers its live card, and goes alone when the card is gone', async () => {
    const { body } = await sent({ ...JOB, replyTo: 41 });
    expect(body).toMatchObject({ reply_parameters: { message_id: 41, allow_sending_without_reply: true } });
  });

  it('the board of the day shows the big picture of its link above the text', async () => {
    const { body } = await sent({ ...JOB, preview: 'https://example.uz/yonalish/toshkent-samarqand/' });
    expect(body).toMatchObject({
      link_preview_options: {
        url: 'https://example.uz/yonalish/toshkent-samarqand/',
        prefer_large_media: true,
        show_above_text: true,
      },
    });
  });

  it('an edit to the same text is done already; a card the person deleted is gone', async () => {
    const same = { description: 'Bad Request: message is not modified' };
    expect((await sent({ ...JOB, edit: 41 }, 400, same)).delivery).toEqual({
      outcome: 'sent',
      messageId: 41,
    });
    const deleted = { description: 'Bad Request: message to edit not found' };
    expect((await sent({ ...JOB, edit: 41 }, 400, deleted)).delivery).toEqual({ outcome: 'gone' });
    const old = { description: "Bad Request: message can't be edited" };
    expect((await sent({ ...JOB, edit: 41 }, 400, old)).delivery).toEqual({ outcome: 'gone' });
  });
});
