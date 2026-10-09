import type { Action } from '../domain/action';

export type { Action };

export type JournalStore = {
  add(action: Action): Promise<void>;
  // The newest first, older than before.
  recent(before: number, limit: number): Promise<Action[]>;
  ofMember(memberId: number, from: number, to: number): Promise<Action[]>;
};
