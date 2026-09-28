// Support in the admin bot (docs/02): anyone writes, the team answers from the same bot.
export type SupportLinks = {
  save(teamChatId: number, teamMessageId: number, personChatId: number, at: number): Promise<void>;
  person(teamChatId: number, teamMessageId: number): Promise<number | undefined>;
};

// Sends a text from the admin bot and returns the id of the sent message.
type SupportMessenger = (chatId: number, text: string, markup?: object) => Promise<number | undefined>;

export type SupportDeps = {
  readonly links: SupportLinks;
  readonly send: SupportMessenger;
  readonly teamIds: () => Promise<number[]>;
  readonly now: () => number;
};

// Each team member gets a copy; a reply to any copy reaches the person.
export async function forwardToTeam(
  deps: SupportDeps,
  personChatId: number,
  text: string,
  markup: (teamId: number) => object | undefined,
): Promise<void> {
  for (const teamId of await deps.teamIds()) {
    const messageId = await deps.send(teamId, text, markup(teamId)).catch(() => undefined);
    if (messageId !== undefined) await deps.links.save(teamId, messageId, personChatId, deps.now());
  }
}

export async function answerPerson(
  deps: SupportDeps,
  teamChatId: number,
  repliedMessageId: number,
  text: string,
): Promise<boolean> {
  const personChatId = await deps.links.person(teamChatId, repliedMessageId);
  if (personChatId === undefined) return false;
  await deps.send(personChatId, text);
  return true;
}
