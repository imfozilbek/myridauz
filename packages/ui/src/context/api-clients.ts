import type {
  BookingsClient,
  CallsClient,
  ChannelsClient,
  ChatClient,
  ComfortClient,
  DriversClient,
  FeedbackClient,
  MapClient,
  MarketClient,
  ModerationClient,
  PricingClient,
  StatsClient,
  SubscriptionsClient,
  WalletClient,
} from '@platform/api-client';
import { createContext, useContext } from 'react';

// API clients signed with the Telegram data of this Mini App (docs/32).
export type ApiClients = {
  readonly drivers: DriversClient;
  readonly moderation: ModerationClient;
  readonly market: MarketClient;
  readonly pricing: PricingClient;
  readonly channels: ChannelsClient;
  readonly bookings: BookingsClient;
  readonly wallet: WalletClient;
  readonly chat: ChatClient;
  readonly subscriptions: SubscriptionsClient;
  readonly feedback: FeedbackClient;
  readonly stats: StatsClient;
  readonly calls: CallsClient;
  readonly comfort: ComfortClient;
  readonly map: MapClient;
};

export const ApiClientsContext = createContext<ApiClients | null>(null);

export function useApiClients(): ApiClients {
  const clients = useContext(ApiClientsContext);
  if (!clients) throw new Error('ui.api_clients_missing');
  return clients;
}
