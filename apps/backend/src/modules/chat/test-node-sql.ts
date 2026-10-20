import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

// Test helper: the SQLite of a Durable Object over the SQLite of Node: exec with several statements
// or with values.
export function nodeSql(): SqlStorage {
  const db = new DatabaseSync(':memory:');
  const exec = (query: string, ...values: SQLInputValue[]) => {
    const rows =
      values.length === 0 && query.includes(';') ? (db.exec(query), []) : db.prepare(query).all(...values);
    return { toArray: () => rows, one: () => rows[0] };
  };
  return { exec } as unknown as SqlStorage;
}
