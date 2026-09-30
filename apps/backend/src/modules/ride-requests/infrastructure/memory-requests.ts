import type { RequestRepository } from '../application/ports';
import { withoutPoints, type RequestRecord } from '../domain/ride-request';

export function createMemoryRequests(): RequestRepository {
  const requests = new Map<string, RequestRecord>();
  return {
    save: async (request) => void requests.set(request.id, request),
    find: async (id) => requests.get(id),
    byPassenger: async (passengerId) =>
      [...requests.values()].filter((request) => request.passengerId === passengerId),
    openOn: async (date) =>
      [...requests.values()]
        .filter((request) => request.status === 'open' && request.date === date)
        .sort((a, b) => a.createdAt - b.createdAt),
    expireOver: async (now) => {
      for (const request of requests.values())
        if (request.status === 'open' && request.expiresAt <= now)
          requests.set(request.id, withoutPoints({ ...request, status: 'expired' }));
    },
    erasePointsOf: async (passengerId) => {
      for (const request of requests.values())
        if (request.passengerId === passengerId) requests.set(request.id, withoutPoints(request));
    },
  };
}
