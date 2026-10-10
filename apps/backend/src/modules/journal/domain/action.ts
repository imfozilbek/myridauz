import type { JournalKind } from '@platform/contracts';

// One decision or change of a member of the team (G75).
export type Action = {
  readonly memberId: number;
  readonly kind: JournalKind;
  readonly subject: string;
  readonly action: string;
  // When the case came: the waits of a member (docs/120); null for a change.
  readonly since: number | null;
  readonly at: number;
};
