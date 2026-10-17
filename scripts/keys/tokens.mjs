import { sameRights } from './rights.mjs';

// The keys of the user of the setup key (docs/189): the setup makes, changes and deletes them, so the
// owner never fills a form of rights by hand. A value comes back only when a key is made or rolled.
const TOKENS = '/user/tokens';
const PAGE = 50;
const HOUR = 60 * 60 * 1000;

export const permissionGroups = (request) => request('GET', `${TOKENS}/permission_groups`);

export async function tokensOf(request) {
  const all = [];
  for (let page = 1; ; page += 1) {
    const list = (await request('GET', `${TOKENS}?per_page=${PAGE}&page=${page}`)) ?? [];
    all.push(...list);
    if (list.length < PAGE) return all;
  }
}

// The key with this name and these rights: made when missing, its rights set again when they differ
// (its value stays then, the place that holds it needs nothing).
export async function ensureToken(request, tokens, name, policies) {
  const found = tokens.find((token) => token.name === name);
  if (!found) {
    const made = await request('POST', TOKENS, { name, policies });
    return { id: made.id, value: made.value, state: 'made' };
  }
  if (sameRights(found.policies ?? [], policies)) return { id: found.id, value: null, state: 'kept' };
  await request('PUT', `${TOKENS}/${found.id}`, { name, policies, status: 'active' });
  return { id: found.id, value: null, state: 'changed' };
}

// The key of one run: it ends by itself in an hour if the run breaks before it deletes it.
export async function hourToken(request, name, policies, now = Date.now()) {
  const expires = new Date(now + HOUR).toISOString().replace(/\.\d+Z$/u, 'Z');
  const made = await request('POST', TOKENS, { name, policies, expires_on: expires });
  return { id: made.id, value: made.value };
}

// A new value of a key; its rights stay.
export const rolled = (request, id) => request('PUT', `${TOKENS}/${id}/value`, {});
export const dropToken = (request, id) => request('DELETE', `${TOKENS}/${id}`);
export const ownId = async (request) => (await request('GET', `${TOKENS}/verify`)).id;

// The old keys of the brand: every key with its name before the dash but the kept ones. A key that makes
// keys is the setup key of an environment: only its own run deletes it.
const makesKeys = (token) =>
  (token.policies ?? []).some((policy) =>
    policy.permission_groups.some((group) => group.name?.startsWith('API Tokens')),
  );
export const oldTokens = (tokens, prefix, kept) =>
  tokens.filter(
    (token) => token.name.startsWith(`${prefix}-`) && !kept.includes(token.name) && !makesKeys(token),
  );
