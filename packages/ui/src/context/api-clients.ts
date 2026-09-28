import type { DriversClient, ModerationClient } from '@platform/api-client';
import { createContext, useContext } from 'react';

// API clients of the driver and the team, signed with the Telegram data of this Mini App (docs/32).
export type ApiClients = { readonly drivers: DriversClient; readonly moderation: ModerationClient };

export const ApiClientsContext = createContext<ApiClients | null>(null);

export function useApiClients(): ApiClients {
  const clients = useContext(ApiClientsContext);
  if (!clients) throw new Error('ui.api_clients_missing');
  return clients;
}
