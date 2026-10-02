import type { Load } from '../domain/pick';
import type { Assignment, AssignmentStore } from '../application/ports';

type Row = Assignment & { answeredAt: number | null };

// In memory: tests and local runs without D1.
export function createMemoryAssignments(): AssignmentStore {
  const rows: Row[] = [];
  const digests = new Set<string>();
  const key = (row: Pick<Assignment, 'kind' | 'subjectId' | 'day'>) =>
    `${row.kind}:${row.subjectId}:${row.day}`;
  return {
    assigneeOf: async (kind, subjectId, day) =>
      rows.find((row) => key(row) === key({ kind, subjectId, day }))?.assigneeId,
    loads: async (day) => {
      const loads = new Map<number, Load>();
      for (const row of rows) {
        const load = loads.get(row.assigneeId) ?? { today: 0, lastAt: null };
        loads.set(row.assigneeId, {
          today: load.today + (row.day === day ? 1 : 0),
          lastAt: Math.max(load.lastAt ?? row.at, row.at),
        });
      }
      return loads;
    },
    save: async (assignment) => {
      const index = rows.findIndex((row) => key(row) === key(assignment));
      rows.splice(index < 0 ? rows.length : index, index < 0 ? 0 : 1, { ...assignment, answeredAt: null });
    },
    operatorOf: async (kind, subjectId) =>
      rows.filter((row) => row.kind === kind && row.subjectId === subjectId).at(-1)?.operator,
    answered: async (kind, subjectId, at) => {
      const open = rows.filter(
        (row) => row.kind === kind && row.subjectId === subjectId && row.answeredAt === null,
      );
      const latest = open.at(-1);
      if (latest) latest.answeredAt = at;
    },
    supportOf: async (day) => {
      const done = new Map<number, { total: number; answered: number }>();
      for (const row of rows.filter((r) => r.kind === 'support' && r.day === day)) {
        const was = done.get(row.assigneeId) ?? { total: 0, answered: 0 };
        done.set(row.assigneeId, {
          total: was.total + 1,
          answered: was.answered + (row.answeredAt === null ? 0 : 1),
        });
      }
      return [...done].map(([assigneeId, counts]) => ({ assigneeId, ...counts }));
    },
    markDigest: async (day) => {
      if (digests.has(day)) return false;
      digests.add(day);
      return true;
    },
  };
}
