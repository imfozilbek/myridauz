import { z } from 'zod';
import { CLIENT_PATTERN } from './arrival';

// The splash never waits this long (docs/121 §4): a longer time is a mistake of the phone clock.
const MAX_READY_MS = 120_000;

// G52: what broke a screen, to find it (docs/112). The class of the error and its words without
// numbers or signs, never free text of a person; client: the Telegram platform, its version
// and the engine with its major version («android 9.6 chrome 83»).
export const crash = {
  error: z
    .string()
    .regex(/^[A-Za-z]{1,40}$/)
    .optional(),
  detail: z
    .string()
    .regex(/^[A-Za-z .,'()_:#-]{0,120}$/)
    .optional(),
  client: z.string().regex(CLIENT_PATTERN).optional(),
  // The place in the build: «index-abc.js:95:12345», no words of a person (docs/112).
  where: z
    .string()
    .regex(/^[A-Za-z0-9_.-]{1,80}\.js:\d{1,7}:\d{1,7}$/)
    .optional(),
};

export const ready = { ms: z.number().int().min(0).max(MAX_READY_MS), client: crash.client };
export const route = z
  .string()
  .regex(/^\d{4}-\d{4}$/)
  .optional();
