import { webhookRoutes } from './webhook-routes';

// Test helper: a fake Telegram that records every call, and a way to send updates to a bot.
type TelegramCall = {
  readonly method: string;
  // The token of the bot that sent it: which bot spoke (docs/50).
  readonly token: string;
  readonly body: Record<string, unknown>;
  readonly id: number;
};

const VOICE_BYTES = new Uint8Array([1, 2, 3]);

// JSON calls and uploads (a form): the text fields of a form, and "voice" for an uploaded voice.
function bodyOf(body: RequestInit['body']): Record<string, unknown> {
  if (typeof body === 'string') return JSON.parse(body) as Record<string, unknown>;
  if (!(body instanceof FormData)) return {};
  const fields = [...body.entries()].map(([key, value]) => [key, typeof value === 'string' ? value : 'file']);
  const parsed: Record<string, unknown> = Object.fromEntries(fields);
  return { ...parsed, chat_id: Number(parsed.chat_id) };
}

export function fakeTelegram() {
  const calls: TelegramCall[] = [];
  let messageId = 100;
  const fetch = async (input: string, init?: RequestInit) => {
    // A file of a bot (a voice message): its bytes.
    if (input.includes('/file/bot')) return new Response(VOICE_BYTES);
    const method = input.split('/').pop() ?? '';
    const token = /\/bot([^/]+)\//u.exec(input)?.[1] ?? '';
    messageId += 1;
    calls.push({ method, token, body: bodyOf(init?.body), id: messageId });
    const result = method === 'getFile' ? { file_path: `voice/${messageId}.oga` } : { message_id: messageId };
    return Response.json({ ok: true, result });
  };
  return { calls, fetch, sentTo: (chatId: number) => calls.filter((call) => call.body.chat_id === chatId) };
}

export const botEnv = {
  PASSENGER_BOT_TOKEN: 'p',
  DRIVER_BOT_TOKEN: 'd',
  ADMIN_BOT_TOKEN: 'a',
  SUPPORT_BOT_TOKEN: 's',
  TELEGRAM_WEBHOOK_SECRET: 'hook',
  ADMIN_TELEGRAM_IDS: '7,8',
};

export function botSender(fetch: ReturnType<typeof fakeTelegram>['fetch']) {
  const routes = webhookRoutes(fetch);
  return (role: string, body: unknown, secret = 'hook', bindings: object = botEnv) =>
    routes.request(
      `/telegram/${role}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': secret },
        body: JSON.stringify(body),
      },
      bindings,
    );
}

export const textMessage = (fromId: number, text: string, replyTo?: number) => ({
  message: {
    message_id: 1,
    text,
    chat: { id: fromId },
    from: { id: fromId, first_name: 'Ali' },
    ...(replyTo === undefined ? {} : { reply_to_message: { message_id: replyTo } }),
  },
});

export const voiceMessage = (fromId: number, replyTo?: number) => ({
  message: {
    ...textMessage(fromId, '', replyTo).message,
    text: undefined,
    voice: { file_id: `voice-of-${fromId}`, duration: 3 },
  },
});

export const photoMessage = (fromId: number, caption?: string, replyTo?: number) => ({
  message: {
    ...textMessage(fromId, '', replyTo).message,
    text: undefined,
    photo: [{ file_id: `small-of-${fromId}` }, { file_id: `photo-of-${fromId}` }],
    ...(caption === undefined ? {} : { caption }),
  },
});
