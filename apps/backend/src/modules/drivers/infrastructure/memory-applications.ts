import type { ApplicationRepository, Decided, DecisionLog } from '../application/ports';
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
    approved: async () =>
      [...applications.values()]
        .filter((application) => application.status === 'approved')
        .map((a) => a.userId),
    samePlate: async (plate, userId) =>
      [...applications.values()].filter(
        (a) => a.userId !== userId && a.status !== 'draft' && a.car?.plate === plate,
      ).length,
  };
}

// In memory: the decisions of the team.
export function createMemoryDecisions(): DecisionLog {
  const log: Decided[] = [];
  return {
    add: async (entry) => void log.push(entry),
    of: async (userId) => log.filter((entry) => entry.userId === userId),
  };
}
