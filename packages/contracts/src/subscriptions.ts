import { z } from 'zod';
import { locationIdSchema } from './locations';
import { dateSchema } from './tashkent-time';

// Route subscriptions (docs/24): a passenger waits for trips, a driver for requests. G10.
export const PASSENGER_SUBSCRIPTIONS_PATH = '/passenger/subscriptions';
export const DRIVER_SUBSCRIPTIONS_PATH = '/driver/subscriptions';
export const subscriptionPath = (base: string, id: string) => `${base}/${id}`;
export const subscriptionRenewPath = (base: string, id: string) => `${base}/${id}/renew`;

export const SUBSCRIPTION_KINDS = ['trips', 'requests'] as const;
export type SubscriptionKind = (typeof SUBSCRIPTION_KINDS)[number];

export const subscriptionInputSchema = z.object({
  from: locationIdSchema,
  to: locationIdSchema,
  // null: any date for the brand's days, then the bot offers to renew it (docs/24).
  date: dateSchema.nullable(),
  // Only trips with "Mashinada ayol bor" (docs/06): passengers only.
  woman: z.boolean(),
});
export type SubscriptionInput = z.infer<typeof subscriptionInputSchema>;

export const subscriptionSchema = subscriptionInputSchema.extend({
  id: z.string(),
  kind: z.enum(SUBSCRIPTION_KINDS),
  expiresAt: z.number().int(),
  // An "any date" subscription that is over: it waits to be renewed or deleted.
  expired: z.boolean(),
});
export type Subscription = z.infer<typeof subscriptionSchema>;
export const subscriptionsSchema = z.object({ subscriptions: z.array(subscriptionSchema) });
