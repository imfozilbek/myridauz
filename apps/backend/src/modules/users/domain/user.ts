import type { Gender, UserRole } from '@platform/contracts';

// One person, one record for all bots (docs/02). Id is the Telegram user id.
export type Block = { readonly until: number | null }; // until: epoch ms, null: for good (docs/17)

export type User = {
  readonly id: number;
  // What the apps see instead of the Telegram ID (docs/65 A3).
  readonly publicId: string;
  readonly firstName: string;
  readonly gender: Gender;
  readonly phone: string;
  readonly locale: 'uz-Latn';
  readonly isDriver: boolean;
  readonly consentAt: number;
  readonly block: Block | null;
  readonly avatarKey: string | null;
  readonly writeAccess: boolean;
  // «Bot xabarlari» off (docs/88 L1): no subscription news and reminders; bookings still come.
  readonly newsOff: boolean;
  readonly createdAt: number;
  readonly updatedAt: number;
};

// Every registered person is a passenger; driver after moderation (G06); admin by the team list.
export function rolesOf(user: User, isAdmin: boolean): UserRole[] {
  const roles: UserRole[] = ['passenger'];
  if (user.isDriver) roles.push('driver');
  if (isAdmin) roles.push('admin');
  return roles;
}

// A temporary block ends by itself (1, 7 or 30 days, docs/17).
// One line of the block journal (docs/65 A5).
export type BlockEntry = {
  readonly userId: number;
  readonly until: number | null;
  readonly by: number;
  readonly reason: string;
  readonly at: number;
};

export function activeBlock(blocks: ReadonlyArray<Block | null>, now: number): Block | null {
  const active = blocks.filter((block): block is Block => block !== null && (block.until ?? Infinity) > now);
  if (active.some((block) => block.until === null)) return { until: null };
  const latest = Math.max(...active.map((block) => block.until ?? 0));
  return active.length > 0 ? { until: latest } : null;
}

// Phones are kept in one form, so a block by phone matches every spelling (docs/17).
export function normalizePhone(raw: string): string {
  return `+${raw.replace(/\D/g, '')}`;
}
