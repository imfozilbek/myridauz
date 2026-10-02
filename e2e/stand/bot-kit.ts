import { readFileSync } from 'node:fs';
import { STAND_API_PORT, STAND_VARS } from '../../scripts/stand/paths.ts';
import type { Person } from './stand-kit';

// Telegram sends an update to a bot of the stand with its secret (docs/32); the bot may answer in
// the reply itself.
const secret = () =>
  readFileSync(STAND_VARS, 'utf8')
    .split('\n')
    .find((line) => line.startsWith('TELEGRAM_WEBHOOK_SECRET='))
    ?.split('=')[1] ?? '';
export type Reply = { text?: string; reply_markup?: { inline_keyboard?: { text: string }[][] } };
async function update(bot: string, body: object): Promise<Reply> {
  const response = await fetch(`http://localhost:${STAND_API_PORT}/telegram/${bot}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': secret() },
    body: JSON.stringify({ update_id: 1, ...body }),
  });
  return (await response.json()) as Reply;
}
const chatOf = (person: Person) => ({ id: person.id, type: 'private' });
const fromOf = (person: Person) => ({ id: person.id, first_name: person.name });

// A message of a person; replyTo: the message of the bot it answers.
export const say = (bot: string, person: Person, text: string, replyTo?: number) =>
  update(bot, {
    message: {
      message_id: 1,
      date: 0,
      text,
      chat: chatOf(person),
      from: fromOf(person),
      ...(replyTo === undefined
        ? {}
        : { reply_to_message: { message_id: replyTo, date: 0, chat: chatOf(person) } }),
    },
  });

// A voice message of a person; replyTo: the message of the bot it answers (docs/50).
export const sayByVoice = (bot: string, person: Person, replyTo?: number) =>
  update(bot, {
    message: {
      message_id: 1,
      date: 0,
      chat: chatOf(person),
      from: fromOf(person),
      voice: { file_id: `voice-${person.id}`, file_unique_id: 'v', duration: 2 },
      ...(replyTo === undefined
        ? {}
        : { reply_to_message: { message_id: replyTo, date: 0, chat: chatOf(person) } }),
    },
  });

// A press on a button under a message of the bot.
export const press = (bot: string, person: Person, data: string) =>
  update(bot, {
    callback_query: {
      id: '1',
      data,
      from: fromOf(person),
      message: { message_id: 1, date: 0, chat: chatOf(person) },
    },
  });

export const buttons = (reply: Reply) =>
  (reply.reply_markup?.inline_keyboard ?? []).flat().map((b) => b.text);
