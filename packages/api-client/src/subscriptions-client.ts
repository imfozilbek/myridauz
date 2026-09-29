import {
  DRIVER_SUBSCRIPTIONS_PATH,
  PASSENGER_SUBSCRIPTIONS_PATH,
  subscriptionPath,
  subscriptionRenewPath,
  subscriptionSchema,
  subscriptionsSchema,
  type Subscription,
  type SubscriptionInput,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// Route subscriptions (docs/24, G10): the passenger app waits for trips, the driver app for requests.
export function createSubscriptionsClient(options: SignedOptions) {
  const { request, post } = signedRequest(options);
  const base = options.app === 'driver' ? DRIVER_SUBSCRIPTIONS_PATH : PASSENGER_SUBSCRIPTIONS_PATH;
  const one = async (response: Response) => subscriptionSchema.parse(await response.json());
  return {
    mine: async (): Promise<Subscription[]> =>
      subscriptionsSchema.parse(await (await request(base)).json()).subscriptions,
    subscribe: async (input: SubscriptionInput): Promise<Subscription> => one(await post(base, input)),
    remove: async (id: string): Promise<void> =>
      void (await request(subscriptionPath(base, id), { method: 'DELETE' })),
    renew: async (id: string): Promise<Subscription> => one(await post(subscriptionRenewPath(base, id), {})),
  };
}

export type SubscriptionsClient = ReturnType<typeof createSubscriptionsClient>;
