import type { ImageStore, StoredImage } from '../../../shared/storage/image-store';
import type { Application } from '../domain/application';

// Ports of the drivers module: D1, R2 and the bots in production, memory in tests.
export type ApplicationRepository = {
  find(userId: number): Promise<Application | undefined>;
  save(application: Application): Promise<void>;
  // Applications waiting for the team, the oldest first.
  queue(): Promise<Application[]>;
  // Ids of approved drivers, for the wallet's Cron job (docs/12).
  approved(): Promise<number[]>;
  // How many other people sent the same plate: a warning for the team (docs/65 C).
  samePlate(plate: string, userId: number): Promise<number>;
};

// One decision of the team on an application (docs/65 C); rows are only added.
export type Decided = {
  readonly userId: number;
  readonly status: Application['status'];
  readonly reasons: readonly string[];
  readonly by: number;
  readonly at: number;
};
export type DecisionLog = { add(entry: Decided): Promise<void>; of(userId: number): Promise<Decided[]> };

// The users module, seen from here: a name and a face, never a phone (docs/07).
export type Person = {
  readonly id: number;
  readonly publicId: string;
  readonly firstName: string;
  readonly avatarKey: string | null;
};
export type PeoplePort = {
  find(id: number): Promise<Person | undefined>;
  // The Telegram ID behind a public id from an admin path (docs/65 A3).
  idOf(publicId: string): Promise<number | undefined>;
  setDriver(id: number, isDriver: boolean): Promise<void>;
  avatar(key: string): Promise<StoredImage | undefined>;
};

// The team gets a card in the admin bot, the driver gets the answer from the driver bot (docs/04).
export type ModerationNotifier = {
  submitted(application: Application, person: Person): Promise<void>;
  // fixedPlate: the plate the team fixed on approval, null when it stayed as the driver wrote it.
  decided(application: Application, fixedPlate: string | null): Promise<void>;
};

export type DriversDeps = {
  readonly applications: ApplicationRepository;
  readonly decisions: DecisionLog;
  readonly photos: ImageStore;
  readonly people: PeoplePort;
  readonly notify: ModerationNotifier;
  // driver_approved: the bonus of month 1 starts from it in G08 (docs/12).
  // The approval event and bonus 1 of the welcome promo (docs/12).
  readonly driverApproved: (userId: number) => Promise<void>;
  readonly now: () => number;
  readonly newId: () => string;
};

export type Result<T, E extends string> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
