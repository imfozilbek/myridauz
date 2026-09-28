import type { ImageStore } from '../../../shared/storage/image-store';
import type { TripRelation } from '../domain/avatar-visibility';
import type { Block, User } from '../domain/user';

// Ports of the users module: D1 and R2 in production, memory in tests and local runs.
export type UserRepository = {
  find(id: number): Promise<User | undefined>;
  save(user: User): Promise<void>;
  // A block by phone stops a new account with the same number (docs/17).
  phoneBlock(phone: string): Promise<Block | null>;
};

// How two people are linked by trips (G07). Used only for photo visibility (docs/05).
export type TripRelations = { relation(viewerId: number, ownerId: number): Promise<TripRelation> };

export type UsersDeps = {
  readonly users: UserRepository;
  readonly avatars: ImageStore;
  readonly trips: TripRelations;
  readonly now: () => number;
  readonly newId: () => string;
};

// Who calls the API, from the checked Telegram signature.
export type Caller = { readonly id: number; readonly firstName: string; readonly isAdmin: boolean };

export type Failure<E extends string> = { readonly ok: false; readonly error: E };
