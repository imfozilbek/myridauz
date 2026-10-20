import { z } from 'zod';

// A person as the apps see them: a random public id, never the Telegram ID (docs/07, docs/65 A3).
// A new account of the same person gets a new one.
export const personIdSchema = z.string().regex(/^[0-9a-f]{32}$/);
export type PersonId = z.infer<typeof personIdSchema>;

// The public id of a deleted account on the old rides of its passengers (G89 M9): the form the apps
// read, nobody behind it.
export const NOBODY_ID = '0'.repeat(32);
export const isGone = (person: { readonly id: string }) => person.id === NOBODY_ID;
