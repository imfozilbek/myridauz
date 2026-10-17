import { describe, expect, it } from 'vitest';
import { ensureToken, hourToken, oldTokens, tokensOf } from './keys/tokens.mjs';

const POLICIES = [
  { effect: 'allow', resources: { 'com.cloudflare.api.account.a1': '*' }, permission_groups: [{ id: 'g1' }] },
];
const OTHER = [{ ...POLICIES[0], permission_groups: [{ id: 'g2' }] }];
// A Cloudflare that writes down every call and answers by method.
const recorder = (answers = {}) => {
  const calls = [];
  const request = async (method, path, body) => {
    calls.push({ method, path, body });
    return typeof answers[method] === 'function' ? answers[method](path) : answers[method];
  };
  return { calls, request };
};

// docs/189: the setup makes every key with its rights, the owner never fills a form by hand.
describe('the keys of the setup', () => {
  it('makes a missing key and gives its value once', async () => {
    const { calls, request } = recorder({ POST: { id: 't1', value: 'secret-value' } });
    const key = await ensureToken(request, [], 'acme-internal-deploy', POLICIES);
    expect(key).toEqual({ id: 't1', value: 'secret-value', state: 'made' });
    expect(calls).toEqual([
      { method: 'POST', path: '/user/tokens', body: { name: 'acme-internal-deploy', policies: POLICIES } },
    ]);
  });

  it('keeps a key with the same rights and touches nothing', async () => {
    const { calls, request } = recorder();
    const tokens = [{ id: 't1', name: 'acme-internal-deploy', policies: POLICIES }];
    expect(await ensureToken(request, tokens, 'acme-internal-deploy', POLICIES)).toEqual({
      id: 't1',
      value: null,
      state: 'kept',
    });
    expect(calls).toEqual([]);
  });

  it('sets the rights again on a key that has others, its value stays', async () => {
    const { calls, request } = recorder();
    const tokens = [{ id: 't1', name: 'acme-internal-deploy', policies: OTHER }];
    const key = await ensureToken(request, tokens, 'acme-internal-deploy', POLICIES);
    expect(key.state).toBe('changed');
    expect(key.value).toBeNull();
    expect(calls).toEqual([
      {
        method: 'PUT',
        path: '/user/tokens/t1',
        body: { name: 'acme-internal-deploy', policies: POLICIES, status: 'active' },
      },
    ]);
  });

  it('gives the key of one run an end in an hour', async () => {
    const { calls, request } = recorder({ POST: { id: 'h1', value: 'hour-value' } });
    const now = Date.parse('2026-10-17T10:15:30.500Z');
    expect(await hourToken(request, 'acme-internal-hour', POLICIES, now)).toEqual({
      id: 'h1',
      value: 'hour-value',
    });
    expect(calls[0].body.expires_on).toBe('2026-10-17T11:15:30Z');
  });

  it('reads every page of the keys', async () => {
    const page = (path) =>
      path.endsWith('page=1')
        ? Array.from({ length: 50 }, (_, index) => ({ id: `t${index}` }))
        : [{ id: 'last' }];
    const { calls, request } = recorder({ GET: page });
    expect(await tokensOf(request)).toHaveLength(51);
    expect(calls.map((call) => call.path)).toEqual([
      '/user/tokens?per_page=50&page=1',
      '/user/tokens?per_page=50&page=2',
    ]);
  });

  it('calls old only the keys of the brand that are neither kept nor setup keys', () => {
    const setupKey = {
      name: 'acme-prod-setup',
      policies: [{ permission_groups: [{ id: 'u', name: 'API Tokens Write' }] }],
    };
    const tokens = [
      { name: 'acme-deploy' },
      { name: 'acme-claude', policies: POLICIES },
      { name: 'acme-internal-deploy' },
      { name: 'other-project-deploy' },
      setupKey,
    ];
    const old = oldTokens(tokens, 'acme', ['acme-internal-deploy']).map((token) => token.name);
    expect(old).toEqual(['acme-deploy', 'acme-claude']);
  });
});
