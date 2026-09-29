// One bot message waiting in the queue (docs/03, docs/07). The text is ready: the queue only sends.
type BotName = 'passenger' | 'driver' | 'admin';

// Something to remember once Telegram gave the message its id: the passenger answers the
// confirmation with the pickup point (docs/14); a channel post is edited later (docs/15).
type AfterSent =
  | { readonly type: 'pickup'; readonly bookingId: string }
  | {
      readonly type: 'channelPost';
      readonly tripId: string;
      readonly channel: string;
      // What the post showed when it was queued: a trip changed since then is edited at once.
      readonly shown: string;
    };

export type NotificationJob = {
  readonly bot: BotName;
  // A person, or a channel as "@username" (docs/15).
  readonly chatId: number | string;
  readonly text: string;
  // The text has HTML marks (bold): a channel post (docs/15).
  readonly html?: boolean;
  // Set: the message with this id is edited instead of a new one sent (a channel post, docs/15).
  readonly edit?: number;
  readonly markup?: object;
  readonly after?: AfterSent;
};

export type AfterSentHandler<Env> = (env: Env, after: AfterSent, messageId: number) => Promise<void>;
