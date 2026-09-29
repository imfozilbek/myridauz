// One bot message waiting in the queue (docs/03, docs/07). The text is ready: the queue only sends.
export type BotName = 'passenger' | 'driver' | 'admin';

// Something to remember once Telegram gave the message its id: the passenger answers the
// confirmation with the pickup point (docs/14).
export type AfterSent = { readonly type: 'pickup'; readonly bookingId: string };

export type NotificationJob = {
  readonly bot: BotName;
  readonly chatId: number;
  readonly text: string;
  readonly markup?: object;
  readonly after?: AfterSent;
};

export type AfterSentHandler<Env> = (env: Env, after: AfterSent, messageId: number) => Promise<void>;
