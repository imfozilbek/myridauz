// Support (docs/50): a person writes to the support bot, every team member gets a copy in the admin
// bot, a reply to any copy goes back to the person from the bot they wrote to.
// 'admin': the copies made before G30, when the admin bot was the support contact.
export type SupportBot = 'support' | 'admin';
export type Writer = { readonly chatId: number; readonly bot: SupportBot };

export type SupportLinks = {
  save(teamChatId: number, teamMessageId: number, writer: Writer, at: number): Promise<void>;
  writer(teamChatId: number, teamMessageId: number): Promise<Writer | undefined>;
};

// What goes between a person and the team: a text, or a voice message with a line about it.
export type Content = { readonly text: string; readonly voice?: ArrayBuffer | undefined };

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

// Each team member gets a copy; a reply to any copy reaches the person.
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
  content: Content,
): Promise<boolean> {
  const writer = await deps.links.writer(teamChatId, repliedMessageId);
  if (writer === undefined) return false;
  await deps.toWriter(writer.bot, writer.chatId, content);
  return true;
}
