import type { DriversClient, MarketClient, ModerationClient, PricingClient } from '@platform/api-client';
import { createContext, useContext } from 'react';

// API clients signed with the Telegram data of this Mini App (docs/32).
export type ApiClients = {
  readonly drivers: DriversClient;
  readonly moderation: ModerationClient;
  readonly market: MarketClient;
  readonly pricing: PricingClient;
};

export const ApiClientsContext = createContext<ApiClients | null>(null);

export function useApiClients(): ApiClients {
  const clients = useContext(ApiClientsContext);
  if (!clients) throw new Error('ui.api_clients_missing');
  return clients;
}
