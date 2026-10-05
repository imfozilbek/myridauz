import type { TeamRole } from '@platform/contracts';

// The team (docs/02): owners come from the brand secret, moderators are added by an owner.
export type TeamRepository = {
  moderators(): Promise<number[]>;
  // One row by the key: every signed request asks it (G56).
  isModerator(userId: number): Promise<boolean>;
  add(userId: number, addedBy: number, at: number): Promise<void>;
  remove(userId: number): Promise<void>;
};

export type Team = {
  readonly owners: ReadonlySet<number>;
  readonly repository: TeamRepository;
};

export type TeamMember = { readonly id: number; readonly role: TeamRole };

export async function roleOf(team: Team, userId: number): Promise<TeamRole | null> {
  if (team.owners.has(userId)) return 'owner';
  return (await team.repository.isModerator(userId)) ? 'moderator' : null;
}

export async function members(team: Team): Promise<TeamMember[]> {
  const owners = [...team.owners].map((id): TeamMember => ({ id, role: 'owner' }));
  const moderators = (await team.repository.moderators())
    .filter((id) => !team.owners.has(id))
    .map((id): TeamMember => ({ id, role: 'moderator' }));
  return [...owners, ...moderators];
}

// Only an owner changes the list of moderators (docs/02, question 36).
export async function setModerator(
  team: Team,
  actorId: number,
  userId: number,
  isModerator: boolean,
  now: number,
): Promise<'ok' | 'team.not_owner'> {
  if (!team.owners.has(actorId)) return 'team.not_owner';
  if (isModerator) await team.repository.add(userId, actorId, now);
  else await team.repository.remove(userId);
  return 'ok';
}
