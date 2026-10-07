import type { Arrival, AvatarStatus, FaceReason } from '@platform/contracts';
import type { ImageStore } from '../../../shared/storage/image-store';
import type { TripRelation } from '../domain/avatar-visibility';
import type { Block, BlockEntry, User } from '../domain/user';

// Ports of the users module: D1 and R2 in production, memory in tests and local runs.
export type UserRepository = {
  // A deleted account is not found: the person may register again.
  find(id: number): Promise<User | undefined>;
  byPublicId(publicId: string): Promise<User | undefined>;
  save(user: User): Promise<void>;
  // "Maʼlumotlarimni oʻchirish": the name, the phone and the photo go, the row stays (docs/30).
  erase(id: number, at: number): Promise<void>;
  // Where the person came from and on what, once at the registration (G55, docs/116).
  arrived(id: number, arrival: Arrival, at: number): Promise<void>;
  // A block by phone stops a new account with the same number (docs/17).
  phoneBlock(phone: string): Promise<Block | null>;
  blockPhone(phone: string, block: Block, at: number): Promise<void>;
  // The block of the id, a deleted account too: the same Telegram account cannot come back (docs/65 A5).
  idBlock(id: number): Promise<Block | null>;
  blockId(id: number, block: Block, at: number): Promise<void>;
  // The owner lifts a block: the id and the phone are free again (docs/65 C).
  unblockId(id: number, at: number): Promise<void>;
  unblockPhone(phone: string): Promise<void>;
  // The phone of a deleted account with an open complaint against it, until the complaint ends.
  holdPhone(id: number, phone: string, at: number): Promise<void>;
  heldPhone(id: number): Promise<string | null>;
  releasePhone(id: number): Promise<void>;
  // Who blocked, when, until when and why: rows are only added.
  logBlock(entry: BlockEntry): Promise<void>;
  blockLog(id: number): Promise<BlockEntry[]>;
  // New face photos waiting for the team, the oldest first (G51).
  pendingFaces(): Promise<User[]>;
  // true once per person: the invite to the channel of their zone is to be sent now (docs/119).
  claimZoneInvite(id: number, at: number): Promise<boolean>;
};

// One decision of the team on a face photo (G51); rows are only added.
export type FaceDecided = {
  readonly userId: number;
  readonly status: Exclude<AvatarStatus, 'pending'>;
  readonly reason: FaceReason | null;
  readonly by: number;
  readonly at: number;
};

// The team hears of a new photo in the admin bot; the person hears of a photo that does not fit.
export type FaceNotifier = {
  uploaded(user: User): Promise<void>;
  rejected(user: User, reason: FaceReason): Promise<void>;
};

// How two people are linked by trips (G07). Used only for photo visibility (docs/05).
export type TripRelations = { relation(viewerId: number, ownerId: number): Promise<TripRelation> };

export type UsersDeps = {
  readonly users: UserRepository;
  readonly avatars: ImageStore;
  readonly trips: TripRelations;
  readonly faceLog: { add(entry: FaceDecided): Promise<void> };
  readonly faces: FaceNotifier;
  readonly now: () => number;
  readonly newId: () => string;
};

// Who calls the API, from the checked Telegram signature.
export type Caller = { readonly id: number; readonly firstName: string; readonly isAdmin: boolean };

export type Failure<E extends string> = { readonly ok: false; readonly error: E };
