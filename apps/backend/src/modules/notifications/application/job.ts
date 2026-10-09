// One bot message waiting in the queue (docs/03, docs/07). The text is ready: the queue only sends.
type BotName = 'passenger' | 'driver' | 'admin';

// Something to remember once Telegram gave the message its id: a channel post is edited later
// (docs/15).
type ChannelPostSent = {
  readonly type: 'channelPost';
  readonly tripId: string;
  readonly channel: string;
  // What the post showed when it was queued: a trip changed since then is edited at once.
  readonly shown: string;
};

// A live card of a person (G68, docs/122 rule 1): its id is kept to edit it, pin it and answer it.
export type CardSent = {
  readonly type: 'card';
  readonly key: string;
  // What the card shows: the same card is not edited again.
  readonly hash: string;
  // On top of the chat (📌) while the trip is ahead; false: taken off the top (rule 6).
  readonly pin?: boolean;
};

export type NotificationJob = {
  readonly bot: BotName;
  // A person, or a channel as "@username" (docs/15).
  readonly chatId: number | string;
  readonly text: string;
  // The text has HTML marks (bold, quote): a channel post (docs/15), a live card (G68).
  readonly html?: boolean;
  // Set: the message with this id is edited instead of a new one sent (docs/15, G68).
  readonly edit?: number;
  readonly markup?: object;
  readonly after?: ChannelPostSent | CardSent;
  // No sound: a card update, the night, the road (G68, docs/122 rules 2, 3).
  readonly silent?: boolean;
  // The message this one answers: a short news under its live card (docs/122 rule 1).
  readonly replyTo?: number;
  // The live card this news answers, found when it is sent: a new card may still wait in the queue.
  readonly replyCard?: string;
  // A link whose big picture shows above the text: the board of the day (docs/122, «Kanallar»).
  readonly preview?: string;
};

export type AfterSentHandler<Env> = (env: Env, after: ChannelPostSent, messageId: number) => Promise<void>;
