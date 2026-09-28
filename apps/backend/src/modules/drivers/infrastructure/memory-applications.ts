import type { ApplicationRepository } from '../application/ports';
import type { Application } from '../domain/application';

// In memory: tests and local runs without D1.
export function createMemoryApplications(): ApplicationRepository {
  const applications = new Map<number, Application>();
  return {
    find: async (userId) => applications.get(userId),
    save: async (application) => void applications.set(application.userId, application),
    queue: async () =>
      [...applications.values()]
        .filter((application) => application.status === 'pending')
        .sort((a, b) => (a.submittedAt ?? 0) - (b.submittedAt ?? 0)),
  };
}
