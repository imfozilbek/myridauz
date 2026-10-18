import { z } from 'zod';

// Only the part of a Telegram update the bots read; everything else is ignored.
const person = z.object({ id: z.number(), first_name: z.string().optional() });
const chat = z.object({ id: z.number() });

const messageSchema = z.object({
  message_id: z.number(),
  text: z.string().optional(),
  chat,
  from: person.optional(),
  // A team member answers a support message by replying to it (docs/02).
  reply_to_message: z.object({ message_id: z.number() }).optional(),
  // A driver answers the trip message with the meeting point (docs/14).
  location: z.object({ latitude: z.number(), longitude: z.number() }).optional(),
  // A voice message to the support bot, or the voice answer of the team (docs/50).
  voice: z.object({ file_id: z.string() }).optional(),
  // A photo to the support bot or in the answer of the team: sizes, the largest last (G32).
  photo: z.array(z.object({ file_id: z.string() })).optional(),
  caption: z.string().optional(),
});
export type BotMessage = z.infer<typeof messageSchema>;

const callbackSchema = z.object({
  id: z.string(),
  from: person,
  data: z.string().optional(),
  message: z.object({ message_id: z.number(), chat }).optional(),
});
export type BotCallback = z.infer<typeof callbackSchema>;

// The person blocked the bot («kicked») or came back («member»): only the statuses (G87 V1, docs/191).
const memberStatus = z.object({ status: z.string() });
const botMemberSchema = z.object({ old_chat_member: memberStatus, new_chat_member: memberStatus });
export type BotMember = z.infer<typeof botMemberSchema>;

export const telegramUpdateSchema = z.object({
  message: messageSchema.optional(),
  callback_query: callbackSchema.optional(),
  my_chat_member: botMemberSchema.optional(),
});
export type TelegramUpdate = z.infer<typeof telegramUpdateSchema>;

export const isStartCommand = (text: string | undefined) =>
  text === '/start' || text?.startsWith('/start ') === true;
