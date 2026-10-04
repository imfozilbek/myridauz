// What broke a screen, in words safe to send (G52, docs/112): the class of the error and its
// message without numbers and signs, so no phone, id or name in another alphabet can get in.
const MAX_DETAIL = 120;
const MAX_CLASS = 40;
const NUMBERS = /\d+/g;
const NOT_SAFE = /[^A-Za-z .,'()_:#-]+/g;
const SPACES = /\s+/g;

export type CrashFacts = { readonly error: string; readonly detail: string };

export function crashFacts(thrown: unknown): CrashFacts {
  const isError = thrown instanceof Error;
  const name = isError ? thrown.name.replace(/[^A-Za-z]/g, '').slice(0, MAX_CLASS) : '';
  const message = isError ? thrown.message : String(thrown);
  const detail = message.replace(NUMBERS, '#').replace(NOT_SAFE, ' ').replace(SPACES, ' ').trim();
  return { error: name || 'Thrown', detail: detail.slice(0, MAX_DETAIL).trim() };
}
