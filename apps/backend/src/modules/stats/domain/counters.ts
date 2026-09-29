// Counted events of a period from Analytics Engine (docs/29): one row per name, source and code.
export type Counter = {
  readonly name: string;
  // The Mini App, or "server" and the bot role for the events of the backend.
  readonly app: string;
  readonly code: string;
  readonly sessions: number;
  readonly events: number;
};

// A funnel step matches events by name and, when set, by Mini App and code.
export type StepMatch = {
  readonly name: string;
  readonly app?: string;
  readonly code?: string;
  // Steps done in another session (by the other side or the server) are counted by events.
  readonly by: 'sessions' | 'events';
};

export const countOf = (counters: readonly Counter[], match: StepMatch): number =>
  counters
    .filter(
      (row) =>
        row.name === match.name &&
        (match.app === undefined || row.app === match.app) &&
        (match.code === undefined || row.code === match.code),
    )
    .reduce((sum, row) => sum + row[match.by], 0);
