// Types for the test helper test-d1.ts: the Worker code has no Node types, the tests run on Node.
declare module 'node:sqlite' {
  export type SQLInputValue = null | number | bigint | string | Uint8Array;
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): {
      all(...values: SQLInputValue[]): unknown[];
      get(...values: SQLInputValue[]): unknown;
      run(...values: SQLInputValue[]): { changes: number | bigint };
    };
  }
}

// Vite (Vitest) reads files of a folder as text at the build of the test.
interface ImportMeta {
  glob(pattern: string, options: { query: '?raw'; import: 'default'; eager: true }): Record<string, string>;
}
