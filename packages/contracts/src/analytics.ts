import { z } from 'zod';

// Product analytics events (docs/29). One place for all Mini Apps; add an event when a goal needs it.
export const ANALYTICS_PATH = '/analytics';
export const MAX_ANALYTICS_BATCH = 50;
export const MINI_APPS = ['passenger', 'driver', 'admin'] as const;
export type MiniApp = (typeof MINI_APPS)[number];
export const REGISTRATION_STEPS = ['consent', 'name', 'gender', 'phone', 'done'] as const;
export type RegistrationStep = (typeof REGISTRATION_STEPS)[number];
export const DRIVER_STEPS = ['car', 'color', 'plate', 'seats', 'avatar', 'photos', 'submitted'] as const;
export type DriverStep = (typeof DRIVER_STEPS)[number];

// Screens and codes are ids, never free text: no personal data can get in (docs/29).
const id = z.string().regex(/^[a-z][a-z0-9_.]{0,47}$/);
const context = {
  app: z.enum(MINI_APPS),
  screen: id,
  at: z.number().int().positive(),
  sessionId: z.uuid(),
  version: z.string().max(32),
};

const analyticsEventSchema = z.discriminatedUnion('name', [
  z.object({ name: z.literal('screen_open'), ...context }),
  z.object({ name: z.literal('client_error'), code: id, ...context }),
  // Registration funnel (G04): one event per finished step, to see where people stop.
  z.object({ name: z.literal('registration_step'), step: z.enum(REGISTRATION_STEPS), ...context }),
  // Driver funnel (G06): one event per finished step of the application, up to "submitted".
  z.object({ name: z.literal('driver_application_step'), step: z.enum(DRIVER_STEPS), ...context }),
]);
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

export const analyticsBatchSchema = z.object({
  events: z.array(analyticsEventSchema).min(1).max(MAX_ANALYTICS_BATCH),
});
export type AnalyticsBatch = z.infer<typeof analyticsBatchSchema>;
