import { webhookRoutes } from './webhook-routes';

// Test helper: a fake Telegram that records every call, and a way to send updates to a bot.
type TelegramCall = {
  readonly method: string;
  readonly body: Record<string, unknown>;
  readonly id: number;
};

export function fakeTelegram() {
  const calls: TelegramCall[] = [];
  let messageId = 100;
  const fetch = async (input: string, init?: RequestInit) => {
    const method = input.split('/').pop() ?? '';
    const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {};
    messageId += 1;
    calls.push({ method, body, id: messageId });
    return Response.json({ ok: true, result: { message_id: messageId } });
  };
  return { calls, fetch, sentTo: (chatId: number) => calls.filter((call) => call.body.chat_id === chatId) };
}

export const botEnv = {
  PASSENGER_BOT_TOKEN: 'p',
  DRIVER_BOT_TOKEN: 'd',
  ADMIN_BOT_TOKEN: 'a',
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
