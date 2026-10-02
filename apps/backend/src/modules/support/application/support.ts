// Support (docs/50): a person writes to the support bot, every team member gets a copy in the admin
// bot, a reply to any copy goes back to the person from the bot they wrote to.
// 'admin': the copies made before G30, when the admin bot was the support contact.
export type SupportBot = 'support' | 'admin';
export type Writer = { readonly chatId: number; readonly bot: SupportBot };

export type SupportLinks = {
  save(teamChatId: number, teamMessageId: number, writer: Writer, at: number): Promise<void>;
  writer(teamChatId: number, teamMessageId: number): Promise<Writer | undefined>;
};

// Sends a text and returns the id of the sent message.
type Messenger = (chatId: number, text: string, markup?: object) => Promise<number | undefined>;

export type SupportDeps = {
  readonly links: SupportLinks;
  // The copies for the team: from the admin bot.
  readonly toTeam: Messenger;
  // The answer for the person: from the bot they wrote to.
  readonly toWriter: (bot: SupportBot, chatId: number, text: string) => Promise<unknown>;
  readonly teamIds: () => Promise<number[]>;
  readonly now: () => number;
};

// Each team member gets a copy; a reply to any copy reaches the person.
export async function forwardToTeam(
  deps: SupportDeps,
  writer: Writer,
  text: string,
  markup: (teamId: number) => object | undefined,
): Promise<void> {
  for (const teamId of await deps.teamIds()) {
    const messageId = await deps.toTeam(teamId, text, markup(teamId)).catch(() => undefined);
    if (messageId !== undefined) await deps.links.save(teamId, messageId, writer, deps.now());
  }
}

export async function answerPerson(
  deps: SupportDeps,
  teamChatId: number,
  repliedMessageId: number,
  text: string,
): Promise<boolean> {
  const writer = await deps.links.writer(teamChatId, repliedMessageId);
  if (writer === undefined) return false;
  await deps.toWriter(writer.bot, writer.chatId, text);
  return true;
}
