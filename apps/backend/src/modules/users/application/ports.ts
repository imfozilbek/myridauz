import type { ImageStore } from '../../../shared/storage/image-store';
import type { TripRelation } from '../domain/avatar-visibility';
import type { Block, BlockEntry, User } from '../domain/user';

// Ports of the users module: D1 and R2 in production, memory in tests and local runs.
export type UserRepository = {
  // A deleted account is not found: the person may register again.
  find(id: number): Promise<User | undefined>;
  save(user: User): Promise<void>;
  // "Maʼlumotlarimni oʻchirish": the name, the phone and the photo go, the row stays (docs/30).
  erase(id: number, at: number): Promise<void>;
  // A block by phone stops a new account with the same number (docs/17).
  phoneBlock(phone: string): Promise<Block | null>;
  blockPhone(phone: string, block: Block, at: number): Promise<void>;
  // The block of the id, a deleted account too: the same Telegram account cannot come back (docs/65 A5).
  idBlock(id: number): Promise<Block | null>;
  blockId(id: number, block: Block, at: number): Promise<void>;
  // The phone of a deleted account with an open complaint against it, until the complaint ends.
  holdPhone(id: number, phone: string, at: number): Promise<void>;
  heldPhone(id: number): Promise<string | null>;
  releasePhone(id: number): Promise<void>;
  // Who blocked, when, until when and why: rows are only added.
  logBlock(entry: BlockEntry): Promise<void>;
  blockLog(id: number): Promise<BlockEntry[]>;
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
