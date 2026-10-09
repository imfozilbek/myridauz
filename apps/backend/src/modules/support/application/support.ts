import type { Media } from '../../../shared/telegram/telegram-files';

// Support (docs/50): a person writes to the support bot, every team member gets a copy in the admin
// bot, a reply to any copy goes back to the person from the bot they wrote to.
// 'admin': the copies made before G30, when the admin bot was the support contact.
export type SupportBot = 'support' | 'admin';
export type Writer = { readonly chatId: number; readonly bot: SupportBot };

// One copy of a question in the admin bot of a team member.
export type Copy = { readonly teamChatId: number; readonly teamMessageId: number };

export type SupportLinks = {
  save(teamChatId: number, teamMessageId: number, writer: Writer, at: number): Promise<void>;
  writer(teamChatId: number, teamMessageId: number): Promise<Writer | undefined>;
  // The last copy of the person in each team chat since then: who else saw the question (G68).
  copies(personChatId: number, since: number): Promise<Copy[]>;
};

// What goes between a person and the team: a text, or a voice message or a photo with a line.
export type Content = {
  readonly text: string;
  readonly media?: Media | undefined;
  // The buttons under the copy for the team («Javob berish», G31).
  readonly markup?: object;
  // The card of a question is in HTML and quiet at night (G68, docs/122).
  readonly html?: boolean;
  readonly quiet?: boolean;
};

// Sends the content and returns the id of the sent message.
type Messenger = (chatId: number, content: Content) => Promise<number | undefined>;

export type SupportDeps = {
  readonly links: SupportLinks;
  // The copies for the team: from the admin bot.
  readonly toTeam: Messenger;
  // The answer for the person: from the bot they wrote to.
  readonly toWriter: (bot: SupportBot, chatId: number, content: Content) => Promise<unknown>;
  readonly teamIds: () => Promise<number[]>;
  readonly now: () => number;
};

// Each given team member gets a copy; a reply to any copy reaches the person.
// The answer goes back to the writer, who is returned to count the work (docs/92).
export async function forwardToTeam(deps: SupportDeps, writer: Writer, content: Content): Promise<void> {
  for (const teamId of await deps.teamIds()) {
    const messageId = await deps.toTeam(teamId, content).catch(() => undefined);
    if (messageId !== undefined) await deps.links.save(teamId, messageId, writer, deps.now());
  }
}

export async function answerPerson(
  deps: SupportDeps,
  teamChatId: number,
  repliedMessageId: number,
  // The answer is made for its person: «Operator N» of this question (docs/92).
  contentFor: (writer: Writer) => Promise<Content>,
): Promise<Writer | undefined> {
  const writer = await deps.links.writer(teamChatId, repliedMessageId);
  if (writer === undefined) return undefined;
  await deps.toWriter(writer.bot, writer.chatId, await contentFor(writer));
  return writer;
}
