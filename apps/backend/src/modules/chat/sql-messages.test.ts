import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { sqlMessages } from './infrastructure/sql-messages';

// The SQLite of a Durable Object over the SQLite of Node: exec with several statements or values.
function nodeSql(): SqlStorage {
  const db = new DatabaseSync(':memory:');
  const exec = (query: string, ...values: SQLInputValue[]) => {
    const rows =
      values.length === 0 && query.includes(';') ? (db.exec(query), []) : db.prepare(query).all(...values);
    return { toArray: () => rows, one: () => rows[0] };
  };
  return { exec } as unknown as SqlStorage;
}

// G89: a deleted account forgets the rows of its chat; the room lives on for the other side.
describe('the chat of a deleted account', () => {
  it('forgets every row and keeps working', () => {
    const store = sqlMessages(nodeSql());
    store.add({ author: 1, text: 'Salom', event: null, masked: false, at: 1 });
    store.notified(2, 1);
    store.rang(1);
    store.forget();
    expect(store.recent(10)).toEqual([]);
    expect([store.lastNotified(2), store.rings(1)]).toEqual([null, 0]);
    expect(store.add({ author: 2, text: 'Kelyapman', event: null, masked: false, at: 2 }).text).toBe(
      'Kelyapman',
    );
  });
});
