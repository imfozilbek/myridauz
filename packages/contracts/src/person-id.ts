import { z } from 'zod';

// A person as the apps see them: a random public id, never the Telegram ID (docs/07, docs/65 A3).
// A new account of the same person gets a new one.
export const personIdSchema = z.string().regex(/^[0-9a-f]{32}$/);
export type PersonId = z.infer<typeof personIdSchema>;
